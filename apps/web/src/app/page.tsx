import { getBalanceStats, getTopEntities, searchEntities } from "@/lib/balance-data";

type Props = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function Home({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const q = sp.q?.trim() ?? "";

  const stats = await getBalanceStats();
  const entities = q ? await searchEntities(q, 60) : await getTopEntities(50);

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">Árbol · primera fuente cargada</p>
        <h1>Balance 2025 de Municipalidad de Posadas</h1>
        <p className="lead">
          Mapa en construcción a partir de proveedores y personas detectados en el
          balance municipal. Los montos vienen de OCR sobre fotos de celular y
          todavía no están verificados.
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
        <strong>Importante:</strong> nombres de proveedores y personas se consideran
        útiles. Los importes hay que contrastarlos con las fotos originales antes de
        darlos por buenos.
      </div>

      <form className="search" action="/" method="get">
        <label htmlFor="q">Buscar proveedor o persona</label>
        <div className="row">
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Ej: PETROVALLE, IRIGARAY..."
            autoComplete="off"
          />
          <button type="submit">Buscar</button>
        </div>
      </form>

      <section className="list">
        <div className="list-head">
          <h2>{q ? `Resultados para “${q}”` : "Más mencionados"}</h2>
          <p>{entities.length} filas</p>
        </div>
        <ul>
          {entities.map((e) => (
            <li key={`${e.kind}-${e.id}`}>
              <div>
                <span className={`tag ${e.kind}`}>
                  {e.kind === "company" ? "Empresa" : "Persona"}
                </span>
                <strong>{e.display_name}</strong>
              </div>
              <em>{e.menciones} menciones</em>
            </li>
          ))}
          {!entities.length && (
            <li className="empty">Todavía no hay datos cargados o no hubo coincidencias.</li>
          )}
        </ul>
      </section>

      <footer className="foot">
        Fuente: {stats.source}. Proyecto Árbol — avance Día 0+.
      </footer>
    </main>
  );
}
