import Link from "next/link";
import { notFound } from "next/navigation";
import { EntityGraphView } from "@/components/EntityGraphView";
import { buildEntityGraph, type EntityKind } from "@/lib/balance-data";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ kind: string; id: string }>;
};

export default async function EntityPage({ params }: Props) {
  const { kind: rawKind, id } = await params;
  if (rawKind !== "person" && rawKind !== "company") notFound();
  const kind = rawKind as EntityKind;

  const graph = await buildEntityGraph(kind, id);
  if (!graph) notFound();

  const { center, nodes, edges } = graph;

  return (
    <main className="page">
      <p className="eyebrow">
        <Link href="/" className="back">
          ← Volver al buscador
        </Link>
      </p>
      <header className="hero">
        <p className="eyebrow">Árbol de relaciones · Balance 2025 Posadas</p>
        <h1>{center.display_name}</h1>
        <p className="lead">
          {center.kind === "company" ? "Proveedor / empresa" : "Persona"} ·{" "}
          {center.menciones} menciones en el balance. Los montos, si aparecen,
          vienen de OCR y <strong>no están verificados</strong> contra las fotos.
        </p>
      </header>

      <section className="panel">
        <div className="list-head">
          <h2>Árbol / grafo de esta ficha</h2>
          <p>
            {nodes.length} nodos · {edges.length} vínculos
          </p>
        </div>
        {nodes.length <= 1 ? (
          <p className="empty-pad">
            Todavía no hay conceptos ni pagos asociados para armar ramas. Puede
            ser un nombre detectado sin detalle OCR útil.
          </p>
        ) : (
          <EntityGraphView nodes={nodes} edges={edges} />
        )}
      </section>

      {center.conceptos.length > 0 && (
        <section className="panel">
          <div className="list-head">
            <h2>Conceptos detectados</h2>
          </div>
          <ul className="chips">
            {center.conceptos.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      )}

      <footer className="foot">
        Fuente: Balance 2025 de Municipalidad de Posadas. Esto es un avance del
        mapa Árbol: acá se ven cercanías por conceptos y pagos OCR, no todavía
        vínculos familiares o societarios completos.
      </footer>
    </main>
  );
}
