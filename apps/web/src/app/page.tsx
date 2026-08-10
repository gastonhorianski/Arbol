import Link from "next/link";
import {
  getBalanceStats,
  getTopEntities,
  searchEntities,
} from "@/lib/balance-data";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function Home({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const q = sp.q?.trim() ?? "";

  const stats = await getBalanceStats();
  const entities = q ? await searchEntities(q, 60) : await getTopEntities(40);

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">Árbol · mapa en construcción</p>
        <h1>Balance 2025 de Municipalidad de Posadas</h1>
        <p className="lead">
          Buscá una persona o empresa y abrí su <strong>árbol de relaciones</strong>
          : conceptos del balance, otros actores cercanos y montos OCR (sin
          verificar).
        </p>
      </header>

      {stats.error ? (
        <div className="banner err">No se pudo leer la base: {stats.error}</div>
      ) : (
        <section className="stats" aria-label="Resumen">
          <article>
            <strong>{stats.companies}</strong>
            <span>Proveedores / empresas</span>
          </article>
          <article>
            <strong>{stats.persons}</strong>
            <span>Personas</span>
          </article>
          <article>
            <strong>{stats.subsidyRows}</strong>
            <span>Montos OCR cargados</span>
          </article>
          <article className="warn-stat">
            <strong>{stats.unverifiedAmounts}</strong>
            <span>Montos sin verificar</span>
          </article>
        </section>
      )}

      <div className="banner warn">
        <strong>Importante:</strong> nombres de proveedores y personas sirven.
        Los importes hay que contrastarlos con las fotos. Probá buscar{" "}
        <Link href="/?q=huls">huls</Link> o{" "}
        <Link href="/?q=luis%20huls">luis huls</Link>.
      </div>

      <form className="search" action="/" method="get">
        <label htmlFor="q">Buscar proveedor o persona</label>
        <div className="row">
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Ej: huls, luis huls, petrovalle..."
            autoComplete="off"
          />
          <button type="submit">Buscar</button>
        </div>
        <p className="hint">
          El buscador usa cada palabra por separado (en cualquier orden). “luis
          huls” encuentra “HULS LUIS…”.
        </p>
      </form>

      <section className="list">
        <div className="list-head">
          <h2>{q ? `Resultados para “${q}”` : "Más mencionados — clic para ver el árbol"}</h2>
          <p>{entities.length} filas</p>
        </div>
        <ul>
          {entities.map((e) => (
            <li key={`${e.kind}-${e.id}`}>
              <Link href={`/e/${e.kind}/${e.id}`} className="row-link">
                <div>
                  <span className={`tag ${e.kind}`}>
                    {e.kind === "company" ? "Empresa" : "Persona"}
                  </span>
                  <strong>{e.display_name}</strong>
                </div>
                <em>
                  {e.menciones} menciones · ver árbol →
                </em>
              </Link>
            </li>
          ))}
          {!entities.length && (
            <li className="empty">
              No hubo coincidencias. Probá una sola palabra (ej. apellido) o
              invertí el orden.
            </li>
          )}
        </ul>
      </section>

      <footer className="foot">
        Fuente: {stats.source}. Clic en un resultado para abrir el árbol.
      </footer>
    </main>
  );
}
