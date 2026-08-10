import { supabase, SOURCE_BALANCE_2025 } from "@/lib/supabase";

export type EntityRow = {
  id: string;
  display_name: string;
  notes: string | null;
  source_label: string | null;
  kind: "person" | "company";
  menciones: number;
};

function parseMenciones(notes: string | null): number {
  if (!notes) return 0;
  const m = notes.match(/menciones=(\d+)/i);
  return m ? Number(m[1]) : 0;
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

export async function getTopEntities(limit = 40): Promise<EntityRow[]> {
  const source = SOURCE_BALANCE_2025;
  const [companies, persons] = await Promise.all([
    supabase
      .from("companies")
      .select("id, display_name, notes, source_label")
      .eq("source_label", source)
      .limit(500),
    supabase
      .from("persons")
      .select("id, display_name, notes, source_label")
      .eq("source_label", source)
      .limit(500),
  ]);

  if (companies.error || persons.error) {
    throw new Error(companies.error?.message || persons.error?.message);
  }

  const rows: EntityRow[] = [
    ...(companies.data ?? []).map((r) => ({
      ...r,
      kind: "company" as const,
      menciones: parseMenciones(r.notes),
    })),
    ...(persons.data ?? []).map((r) => ({
      ...r,
      kind: "person" as const,
      menciones: parseMenciones(r.notes),
    })),
  ];

  return rows.sort((a, b) => b.menciones - a.menciones).slice(0, limit);
}

export async function searchEntities(q: string, limit = 50): Promise<EntityRow[]> {
  const source = SOURCE_BALANCE_2025;
  const term = q.trim();
  if (!term) return getTopEntities(limit);

  const [companies, persons] = await Promise.all([
    supabase
      .from("companies")
      .select("id, display_name, notes, source_label")
      .eq("source_label", source)
      .ilike("display_name", `%${term}%`)
      .limit(limit),
    supabase
      .from("persons")
      .select("id, display_name, notes, source_label")
      .eq("source_label", source)
      .ilike("display_name", `%${term}%`)
      .limit(limit),
  ]);

  const rows: EntityRow[] = [
    ...(companies.data ?? []).map((r) => ({
      ...r,
      kind: "company" as const,
      menciones: parseMenciones(r.notes),
    })),
    ...(persons.data ?? []).map((r) => ({
      ...r,
      kind: "person" as const,
      menciones: parseMenciones(r.notes),
    })),
  ];

  return rows.sort((a, b) => b.menciones - a.menciones).slice(0, limit);
}
