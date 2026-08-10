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
    .filter((c) => c.length > 1);
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

  const nodes: GraphNode[] = [
    {
      id: `center:${center.id}`,
      label: center.display_name,
      kind: center.kind,
      detail: `${center.menciones} menciones`,
      href: `/e/${center.kind}/${center.id}`,
    },
  ];
  const edges: GraphEdge[] = [];

  // Conceptos del balance
  for (const concept of center.conceptos.slice(0, 6)) {
    const cid = `concept:${concept}`;
    nodes.push({ id: cid, label: concept, kind: "concept" });
    edges.push({
      id: `e-${center.id}-${cid}`,
      source: `center:${center.id}`,
      target: cid,
      label: "concepto",
    });
  }

  // Montos (solo empresas) — sin verificar
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
      nodes.push({
        id: pid,
        label: amount,
        kind: "payment",
        detail: p.amount_verified
          ? "verificado"
          : "sin verificar (OCR)",
      });
      edges.push({
        id: `e-${center.id}-${pid}`,
        source: `center:${center.id}`,
        target: pid,
        label: p.program_name || "pago",
      });
    }
  }

  // Otros actores que comparten conceptos (árbol de cercanía)
  if (center.conceptos.length) {
    const all = await fetchSourceEntities(1000);
    const related = all
      .filter((e) => e.id !== center.id)
      .map((e) => ({
        entity: e,
        shared: e.conceptos.filter((c) => center.conceptos.includes(c)),
      }))
      .filter((x) => x.shared.length > 0)
      .sort(
        (a, b) =>
          b.shared.length - a.shared.length ||
          b.entity.menciones - a.entity.menciones,
      )
      .slice(0, 10);

    for (const rel of related) {
      const nid = `${rel.entity.kind}:${rel.entity.id}`;
      nodes.push({
        id: nid,
        label: rel.entity.display_name,
        kind: rel.entity.kind,
        detail: `comparte: ${rel.shared.slice(0, 2).join(", ")}`,
        href: `/e/${rel.entity.kind}/${rel.entity.id}`,
      });
      const sharedConcept = rel.shared[0];
      const conceptNode = `concept:${sharedConcept}`;
      if (nodes.some((n) => n.id === conceptNode)) {
        edges.push({
          id: `e-${conceptNode}-${nid}`,
          source: conceptNode,
          target: nid,
          label: "también aparece",
        });
      } else {
        edges.push({
          id: `e-center-${nid}`,
          source: `center:${center.id}`,
          target: nid,
          label: "concepto compartido",
        });
      }
    }
  }

  return { center, nodes, edges };
}
