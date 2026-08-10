# Árbol — Knowledge Graph político-económico

Mapa de relaciones entre políticos, familiares, empresas y subsidios.

## Stack

- **GitHub** — código
- **Vercel** — deploy + preview por PR
- **Supabase** — Postgres (`arbol-kg-staging`, org VASTO; proyecto **nuevo**, no la DB de panadería)

## Arranque local

```bash
npm install
cp apps/web/.env.example apps/web/.env.local
# Completar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

## Estructura

```text
apps/web              UI Next.js
packages/domain       Contrato de tipos (DNI/CUIT, rel_types)
packages/db           Notas / espejo de migraciones
scripts/ingest        ETL por fuente
supabase/migrations   SQL versionado
docs/                 Guía del equipo (MD + HTML + PDF)
```

## Equipo asíncrono

Leé [`docs/GUIA_EQUIPO.md`](docs/GUIA_EQUIPO.md) o abrí [`docs/GUIA_EQUIPO.html`](docs/GUIA_EQUIPO.html) e imprimí a PDF.

Regla: **IA libre (Claude/Cursor/etc.), repo y datos compartidos.**

## Vercel (Día 0)

1. Push este repo a GitHub.
2. [vercel.com/new](https://vercel.com/new) → Import repo.
3. Root Directory: `apps/web` (o monorepo con workspace).
4. Env vars: las mismas de `.env.example`.
5. Cada PR genera preview automático.

## Supabase

- Proyecto: `arbol-kg-staging` (ref `yevtcxmusooynydsygng`, región `sa-east-1`)
- Migración inicial: `supabase/migrations/20260810120000_initial_kg_schema.sql`
