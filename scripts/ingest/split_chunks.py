from pathlib import Path
import re

src = Path(r"C:\Users\orlan\Desktop\Arbol\scripts\ingest\balance_2025_posadas.sql")
full = src.read_text(encoding="utf-8")
body = full.replace("begin;", "").replace("commit;", "")
stmts = [s.strip() for s in body.split(";") if s.strip()]

deletes = [s for s in stmts if s.lower().startswith("delete")]
companies = [s for s in stmts if "into public.companies" in s.lower()]
persons = [s for s in stmts if "into public.persons" in s.lower()]

m = re.search(r"with pay as \(.*", full, re.S | re.I)
subsidy_sql = None
if m:
    subsidy_sql = m.group(0).replace("commit;", "").strip()
    if not subsidy_sql.endswith(";"):
        subsidy_sql += ";"

out = Path(r"C:\Users\orlan\Desktop\Arbol\scripts\ingest\chunks")
out.mkdir(exist_ok=True)
(out / "00_delete.sql").write_text(";\n".join(deletes) + ";\n", encoding="utf-8")


def write_batches(name: str, items: list[str], size: int = 70) -> int:
    n = 0
    for i in range(0, len(items), size):
        batch = items[i : i + size]
        p = out / f"{name}_{i // size:02d}.sql"
        p.write_text(";\n".join(batch) + ";\n", encoding="utf-8")
        n += 1
    return n


c_batches = write_batches("01_companies", companies, 70)
p_batches = write_batches("02_persons", persons, 70)
if subsidy_sql:
    (out / "03_subsidies.sql").write_text(subsidy_sql + "\n", encoding="utf-8")

print(
    {
        "deletes": len(deletes),
        "companies": len(companies),
        "persons": len(persons),
        "company_batches": c_batches,
        "person_batches": p_batches,
        "subsidy": bool(subsidy_sql),
    }
)
