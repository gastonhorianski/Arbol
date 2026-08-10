# Conectar Vercel al monorepo Árbol

1. Crear repo en GitHub y hacer push de este código.
2. En Vercel → Add New Project → Import del repo.
3. Framework: Next.js.
4. Root Directory: `apps/web`.
5. Install Command: desde la raíz del monorepo preferí:
   - Install: `npm install` (si el root es el monorepo, configurá Root Directory vacío y Build `npm run build -w apps/web`),
   - o Root Directory `apps/web` si instalás solo ahí.
6. Environment Variables (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. Deploy. Cada PR tendrá su URL de preview.

No hace falta dominio propio el Día 0: usá `*.vercel.app`.
