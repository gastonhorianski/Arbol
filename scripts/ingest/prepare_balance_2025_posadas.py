"""Generate and optionally print Balance 2025 Posadas SQL batches."""
from __future__ import annotations

import json
import re
from pathlib import Path

SOURCE = "Balance 2025 de Municipalidad de Posadas"
RAW = Path(r"D:\Escritorio\BALANE 2025\beneficiarios_raw.json")
OUT = Path(r"C:\Users\orlan\Desktop\Arbol\scripts\ingest\chunks")

COMPANY_MARKERS = (
    "S.A",
    " SA",
    "S.R.L",
    "SRL",
    "S.A.S",
    "SAS",
    "LTDA",
    "S.C.",
    " COOP",
    "UTE ",
    "S.H.",
    "CIA.",
    "CÍA",
)

NOISE = (
    "FONDO ",
    "REPOS.",
    "UTILES",
    "ÚTILES",
    "MATERIALES",
    "VESTUARIOS",
    "ART.",
    "ASEO",
    "LIMPIEZA",
    "SEGURIDAD",
    "COMBUSTIBLE",
    "NAFTA",
    "GAS-OIL",
    "GAS OIL",
)


def sql_str(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def normalize_name(name: str) -> str:
    n = re.sub(r"\s+", " ", name.strip())
    n = re.sub(r"[\-–—]+$", "", n).strip()
    n = re.sub(r"\s+S\.?\s*A\.?\s*$", " S.A", n, flags=re.I)
    n = re.sub(r"\s+S\.?\s*R\.?\s*L\.?\s*$", " S.R.L", n, flags=re.I)
    return n


def is_person(name: str) -> bool:
    u = name.upper()
    if any(m in u for m in COMPANY_MARKERS):
        return False
    if any(m in u for m in NOISE):
        return False
    if re.search(r"\d", name):
        return False
    tokens = [t for t in re.split(r"\s+", name) if t]
    if not (2 <= len(tokens) <= 4):
        return False
    if not all(re.fullmatch(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ.'-]+", t) for t in tokens):
        return False
    if " Y " in u and len(tokens) >= 4:
        return False
    return True


def main() -> None:
    data = json.loads(RAW.read_text(encoding="utf-8"))
    merged: dict[str, dict] = {}
    for raw_name, payload in data.items():
        name = normalize_name(raw_name)
        if not name:
            continue
        key = name.casefold()
        cur = merged.get(key)
        if not cur:
            merged[key] = {
                "display_name": name,
                "menciones": int(payload.get("menciones") or 0),
                "montos": list(payload.get("montos") or []),
                "conceptos": list(payload.get("conceptos") or []),
            }
            continue
        cur["menciones"] += int(payload.get("menciones") or 0)
        cur["montos"].extend(payload.get("montos") or [])
        for c in payload.get("conceptos") or []:
            if c not in cur["conceptos"]:
                cur["conceptos"].append(c)

    persons = []
    companies = []
    for item in merged.values():
        if is_person(item["display_name"]):
            persons.append(item)
        else:
            companies.append(item)

    if OUT.exists():
        for old in OUT.glob("*.sql"):
            old.unlink()
    OUT.mkdir(parents=True, exist_ok=True)

    (OUT / "00_delete.sql").write_text(
        "\n".join(
            [
                f"delete from public.subsidies where source_label = {sql_str(SOURCE)};",
                f"delete from public.persons where source_label = {sql_str(SOURCE)};",
                f"delete from public.companies where source_label = {sql_str(SOURCE)};",
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    def write_entity_batches(prefix: str, table: str, items: list[dict], size: int = 60) -> int:
        n = 0
        for i in range(0, len(items), size):
            batch = items[i : i + size]
            rows = []
            for item in batch:
                conceptos = " | ".join(item["conceptos"][:6])
                notes = f"menciones={item['menciones']} | conceptos={conceptos}"[:480]
                rows.append(
                    f"({sql_str(item['display_name'])}, {sql_str(notes)}, {sql_str(SOURCE)})"
                )
            sql = (
                f"insert into public.{table} (display_name, notes, source_label) values\n"
                + ",\n".join(rows)
                + ";\n"
            )
            (OUT / f"{prefix}_{n:02d}.sql").write_text(sql, encoding="utf-8")
            n += 1
        return n

    c_batches = write_entity_batches("01_companies", "companies", companies, 60)
    p_batches = write_entity_batches("02_persons", "persons", persons, 60)

    value_rows = []
    for item in companies:
        for amount in item["montos"]:
            try:
                amt = float(amount)
            except (TypeError, ValueError):
                continue
            if amt < 0:
                continue
            concept = item["conceptos"][0] if item["conceptos"] else None
            value_rows.append(
                "("
                f"{sql_str(item['display_name'])}, {amt:.2f}, "
                f"{sql_str(concept) if concept else 'null'}, "
                f"{sql_str(SOURCE)}"
                ")"
            )

    if value_rows:
        subsidy_sql = f"""
with pay as (
  select * from (values
{',\n'.join(value_rows)}
  ) as t(display_name, amount_ars, program_name, source_label)
)
insert into public.subsidies (
  company_id, amount_ars, program_name, source_label, amount_verified, confidence, source_document
)
select c.id, p.amount_ars, p.program_name, p.source_label, false, 0.40, p.source_label
from pay p
join public.companies c
  on lower(c.display_name) = lower(p.display_name)
 and c.source_label = p.source_label;
"""
        (OUT / "03_subsidies.sql").write_text(subsidy_sql.strip() + "\n", encoding="utf-8")

    meta = {
        "companies": len(companies),
        "persons": len(persons),
        "company_batches": c_batches,
        "person_batches": p_batches,
        "subsidy_rows": len(value_rows),
    }
    (OUT / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(meta, ensure_ascii=False))


if __name__ == "__main__":
    main()
