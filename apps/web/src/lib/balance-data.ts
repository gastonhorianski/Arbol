import { supabase, SOURCE_BALANCE_2025 } from "@/lib/supabase";

export type EntityKind = "person" | "company";

export type EntityRow = {
  id: string;
  display_name: string;
  notes: string | null;
  source_label: string | null;
  kind: EntityKind;
  menciones: number;
  conceptos: string[];
};

export type GraphNode = {
  id: string;
  label: string;
  kind: "person" | "company" | "concept" | "payment";
  detail?: string;
  /** Explicación legible de por qué aparece en este árbol */
  reason?: string;
  href?: string;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type EntityGraph = {
  center: EntityRow;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

function parseMenciones(notes: string | null): number {
  if (!notes) return 0;
  const m = notes.match(/menciones=(\d+)/i);
  return m ? Number(m[1]) : 0;
}

function parseConceptos(notes: string | null): string[] {
  if (!notes) return [];
  const m = notes.match(/conceptos=(.*)$/i);
  if (!m?.[1]) return [];
  return m[1]
    .split("|")
    .map((c) => c.trim())
    .filter((c) => isMeaningfulConcept(c));
}

/** Descarta rubros demasiado genéricos o ruidosos del OCR. */
function isMeaningfulConcept(concept: string): boolean {
  const c = concept.trim();
  if (c.length < 14) return false;
  const u = c.toLocaleUpperCase("es");

  // Publicidad / pub institucional genérica: solo si es muy específica
  if (u.includes("PUBLICIDAD") || u.includes("PUB.INSTITUCIONAL") || u.startsWith("PUB.")) {
    return u.length >= 30;
  }

  // Otros rubros masivos/cortos
  if (
    /^(SERV\.?|ALQ\.?|ADICIONAL|REPARACION|HABERES|MATERIALES)\b/.test(u) &&
    u.length < 24
  ) {
    return false;
  }

  return true;
}

function nameSignature(name: string): string {
  return name
    .toLocaleUpperCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .slice(0, 2)
    .join(" ");
}

function likelySameOrAlias(a: string, b: string): boolean {
  const sa = nameSignature(a);
  const sb = nameSignature(b);
  if (!sa || !sb || sa !== sb) return false;
  // evitar juntar nombres cortos demasiado comunes
  return sa.split(" ").join("").length >= 8;
}

function tokensFromQuery(q: string): string[] {
  return q
    .trim()
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function mapRow(
  r: {
    id: string;
    display_name: string;
    notes: string | null;
    source_label: string | null;
  },
  kind: EntityKind,
): EntityRow {
  return {
    ...r,
    kind,
    menciones: parseMenciones(r.notes),
    conceptos: parseConceptos(r.notes),
  };
}

function matchesAllTokens(name: string, tokens: string[]): boolean {
  const hay = name.toLocaleLowerCase("es");
  return tokens.every((t) => hay.includes(t.toLocaleLowerCase("es")));
}

export async function getBalanceStats() {
  const source = SOURCE_BALANCE_2025;
  const [companies, persons, subsidies, unverified] = await Promise.all([
    supabase
      .from("companies")
      .select("*", { count: "exact", head: true })
      .eq("source_label", source),
    supabase
      .from("persons")
      .select("*", { count: "exact", head: true })
      .eq("source_label", source),
    supabase
      .from("subsidies")
      .select("*", { count: "exact", head: true })
      .eq("source_label", source),
    supabase
      .from("subsidies")
      .select("*", { count: "exact", head: true })
      .eq("source_label", source)
      .eq("amount_verified", false),
  ]);

  return {
    companies: companies.count ?? 0,
    persons: persons.count ?? 0,
    subsidyRows: subsidies.count ?? 0,
    unverifiedAmounts: unverified.count ?? 0,
    source,
    error:
      companies.error?.message ||
      persons.error?.message ||
      subsidies.error?.message ||
      null,
  };
}

async function fetchSourceEntities(limit = 1000): Promise<EntityRow[]> {
  const source = SOURCE_BALANCE_2025;
  const [companies, persons] = await Promise.all([
    supabase
      .from("companies")
      .select("id, display_name, notes, source_label")
      .eq("source_label", source)
      .limit(limit),
    supabase
      .from("persons")
      .select("id, display_name, notes, source_label")
      .eq("source_label", source)
      .limit(limit),
  ]);

  if (companies.error || persons.error) {
    throw new Error(companies.error?.message || persons.error?.message);
  }

  return [
    ...(companies.data ?? []).map((r) => mapRow(r, "company")),
    ...(persons.data ?? []).map((r) => mapRow(r, "person")),
  ];
}

export async function getTopEntities(limit = 40): Promise<EntityRow[]> {
  const rows = await fetchSourceEntities(800);
  return rows.sort((a, b) => b.menciones - a.menciones).slice(0, limit);
}

/** Busca por cada palabra (AND), en cualquier orden. "luis huls" encuentra "HULS LUIS..." */
export async function searchEntities(q: string, limit = 50): Promise<EntityRow[]> {
  const tokens = tokensFromQuery(q);
  if (!tokens.length) return getTopEntities(limit);

  const source = SOURCE_BALANCE_2025;
  // Primera palabra vía SQL para achicar; el resto se filtra en memoria (orden libre).
  const primary = tokens[0];

  const [companies, persons] = await Promise.all([
    supabase
      .from("companies")
      .select("id, display_name, notes, source_label")
      .eq("source_label", source)
      .ilike("display_name", `%${primary}%`)
      .limit(300),
    supabase
      .from("persons")
      .select("id, display_name, notes, source_label")
      .eq("source_label", source)
      .ilike("display_name", `%${primary}%`)
      .limit(300),
  ]);

  const rows: EntityRow[] = [
    ...(companies.data ?? []).map((r) => mapRow(r, "company")),
    ...(persons.data ?? []).map((r) => mapRow(r, "person")),
  ].filter((r) => matchesAllTokens(r.display_name, tokens));

  return rows.sort((a, b) => b.menciones - a.menciones).slice(0, limit);
}

export async function getEntity(
  kind: EntityKind,
  id: string,
): Promise<EntityRow | null> {
  const table = kind === "company" ? "companies" : "persons";
  const { data, error } = await supabase
    .from(table)
    .select("id, display_name, notes, source_label")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapRow(data, kind);
}

export async function buildEntityGraph(
  kind: EntityKind,
  id: string,
): Promise<EntityGraph | null> {
  const center = await getEntity(kind, id);
  if (!center) return null;

  const all = await fetchSourceEntities(1000);

  const conceptFreq = new Map<string, number>();
  for (const e of all) {
    for (const c of e.conceptos) {
      conceptFreq.set(c, (conceptFreq.get(c) ?? 0) + 1);
    }
  }

  const ownConcepts = center.conceptos.slice(0, 6);

  const nodes: GraphNode[] = [
    {
      id: `center:${center.id}`,
      label: center.display_name,
      kind: center.kind,
      detail: `${center.menciones} menciones en el balance`,
      reason:
        "Ficha central. Solo mostramos vínculos con evidencia concreta: pagos propios, conceptos propios, posibles alias del mismo nombre, o rubros poco frecuentes compartidos.",
      href: `/e/${center.kind}/${center.id}`,
    },
  ];
  const edges: GraphEdge[] = [];

  for (const concept of ownConcepts) {
    const cid = `concept:${concept}`;
    const freq = conceptFreq.get(concept) ?? 1;
    nodes.push({
      id: cid,
      label: concept,
      kind: "concept",
      detail: "Concepto propio en el balance",
      reason: `Este rubro aparece en los registros de ${center.display_name} en el Balance 2025 de Municipalidad de Posadas${freq <= 3 ? " (poco frecuente: más específico)" : ""}.`,
    });
    edges.push({
      id: `e-${center.id}-${cid}`,
      source: `center:${center.id}`,
      target: cid,
      label: "concepto propio",
    });
  }

  if (center.kind === "company") {
    const { data: payments } = await supabase
      .from("subsidies")
      .select("id, amount_ars, program_name, amount_verified")
      .eq("company_id", center.id)
      .limit(8);

    for (const p of payments ?? []) {
      const pid = `pay:${p.id}`;
      const amount = Number(p.amount_ars).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      });
      const program = p.program_name || "concepto no legible";
      nodes.push({
        id: pid,
        label: amount,
        kind: "payment",
        detail: p.amount_verified ? "Monto verificado" : "Monto OCR sin verificar",
        reason: p.amount_verified
          ? `Pago a nombre de ${center.display_name} por «${program}».`
          : `Pago a nombre de ${center.display_name} por «${program}». Importe OCR: verificar contra la foto.`,
      });
      edges.push({
        id: `e-${center.id}-${pid}`,
        source: `center:${center.id}`,
        target: pid,
        label: "pago propio",
      });
    }
  }

  const aliases = all
    .filter((e) => e.id !== center.id && e.kind === center.kind)
    .filter((e) => likelySameOrAlias(center.display_name, e.display_name))
    .sort((a, b) => b.menciones - a.menciones)
    .slice(0, 5);

  for (const alias of aliases) {
    const nid = `${alias.kind}:${alias.id}`;
    nodes.push({
      id: nid,
      label: alias.display_name,
      kind: alias.kind,
      detail: `${alias.menciones} menciones · posible alias`,
      reason: `Se conecta con ${center.display_name} porque el nombre es casi igual (núcleo «${nameSignature(center.display_name)}»). En OCR el mismo actor a veces aparece con variantes. Es posible misma persona/empresa, no un vínculo social nuevo.`,
      href: `/e/${alias.kind}/${alias.id}`,
    });
    edges.push({
      id: `e-alias-${alias.id}`,
      source: `center:${center.id}`,
      target: nid,
      label: "posible alias",
    });
  }

  const rareShared = all
    .filter((e) => e.id !== center.id)
    .filter((e) => !aliases.some((a) => a.id === e.id))
    .map((e) => {
      const sharedRare = e.conceptos.filter((c) => {
        if (!center.conceptos.includes(c)) return false;
        return (conceptFreq.get(c) ?? 99) <= 3;
      });
      return { entity: e, sharedRare };
    })
    .filter((x) => x.sharedRare.length > 0)
    .sort(
      (a, b) =>
        b.sharedRare.length - a.sharedRare.length ||
        b.entity.menciones - a.entity.menciones,
    )
    .slice(0, 6);

  for (const rel of rareShared) {
    const nid = `${rel.entity.kind}:${rel.entity.id}`;
    const sharedList = rel.sharedRare
      .slice(0, 2)
      .map((c) => `«${c}»`)
      .join(", ");
    nodes.push({
      id: nid,
      label: rel.entity.display_name,
      kind: rel.entity.kind,
      detail: `${rel.entity.menciones} menciones · rubro raro compartido`,
      reason: `Se conecta con ${center.display_name} porque ambos aparecen bajo el mismo rubro poco frecuente ${sharedList}. Eso es más informativo que compartir «publicidad institucional» genérica. No prueba parentesco ni sociedad.`,
      href: `/e/${rel.entity.kind}/${rel.entity.id}`,
    });

    const bridge = rel.sharedRare[0];
    const conceptNode = `concept:${bridge}`;
    if (!nodes.some((n) => n.id === conceptNode)) {
      nodes.push({
        id: conceptNode,
        label: bridge,
        kind: "concept",
        detail: "Rubro poco frecuente",
        reason:
          "Rubro específico del Balance 2025 compartido por pocos actores (≤3).",
      });
      edges.push({
        id: `e-${center.id}-${conceptNode}`,
        source: `center:${center.id}`,
        target: conceptNode,
        label: "concepto propio",
      });
    }
    edges.push({
      id: `e-${conceptNode}-${nid}`,
      source: conceptNode,
      target: nid,
      label: "mismo rubro raro",
    });
  }

  return { center, nodes, edges };
}

