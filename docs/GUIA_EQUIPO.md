# Árbol — Guía de trabajo del equipo

**Documento Día 0.** Léelo una vez. Después, solo “hacer y subir”.

---

## 1. Qué estamos construyendo

Un **mapa de relaciones** (knowledge graph) entre:

- Políticos y funcionarios  
- Familiares  
- Empresas (propiedad / directorio / participación)  
- Subsidios del Estado a esas empresas  

Objetivo: ver **cómo fluye el dinero público** a través de vínculos familiares y corporativos.

---

## 2. Regla de oro

> **La IA es personal. El proyecto es compartido.**

Podés usar **Claude, Cursor, ChatGPT o lo que sea**.  
No hace falta que todos usemos la misma herramienta.

Lo que sí compartimos:

| Pieza | Para qué sirve |
| --- | --- |
| **GitHub** | El código de todos |
| **Vercel** | Link automático para ver el avance (sin instalar nada) |
| **Supabase** | La base de datos central (proyecto **nuevo**, no el de VASTO) |

---

## 3. Cómo trabajamos (paso a paso)

1. Trabajás en **tu parte** (ver sección 5).  
2. Pedile a tu IA que genere código **solo en tu carpeta**.  
3. Subís a GitHub en una **rama** (no directo a `main`).  
4. Abrís un **Pull Request**.  
5. Vercel genera un **link preview** → ese link se lo mandás al resto.  
6. Si está bien, se mezcla a `main` y queda en producción.

**Sin reuniones.** El preview es la reunión.

---

## 4. Identidad de datos (contrato de oro)

- Personas: anclar con **DNI** (si existe).  
- Empresas: anclar con **CUIT** (si existe).  
- El **nombre** es solo una etiqueta (puede haber varios alias).  
- En la base, la clave interna es un **UUID**; DNI/CUIT son únicos cuando existen.  
- **Nunca** inventar DNI/CUIT. Si no está, dejar vacío y marcar la fuente.

Cada hecho debería poder responder: ¿de dónde salió? (`source_url`, fecha, confianza).

---

## 5. Quién toca qué (para no pisarnos)

| Rol | Dueño de | No tocar sin avisar |
| --- | --- | --- |
| Persona A | UI del mapa / fichas (`apps/web`) | Migraciones de base |
| Persona B | Schema / migraciones (`packages/db`) | Componentes visuales del grafo |
| Persona C | Carga de datos / ETL (`scripts/ingest`) | UI |

**Carpetas sagradas (hablar antes de cambiar):**

- `packages/domain` — tipos y reglas compartidas  
- `packages/db/migrations` — estructura de la base  

---

## 6. Nombres de ramas

```text
feat/<inicial>/<tema>
```

Ejemplos:

- `feat/o/graph-ui`  
- `feat/p/ingest-subsidios`  
- `feat/m/schema-persons`  

Una PR = un tema. Si tocás base + UI, mejor dos PRs.

---

## 7. Qué NO hacemos (por ahora)

- No mezclar datos con el proyecto Supabase de **VASTO / panadería**.  
- No crear tablas “a mano” solo en el panel de Supabase: van por **migración en el repo**.  
- No usar Neo4j ni otra base de grafos en Fase 1 (Postgres alcanza).  
- No pelear por Claude vs Cursor.

---

## 8. Analogía rápida

| En la vida real | En el proyecto |
| --- | --- |
| Tu Word / Google Docs | Tu IA (Claude, Cursor…) |
| Carpeta compartida del Drive | GitHub |
| Link público del documento | Vercel preview |
| Planilla central | Supabase (proyecto Árbol) |

---

## 9. Links

- Repo GitHub: _(crear y pegar URL)_  
- Preview / producción Vercel: _(conectar repo — ver `docs/VERCEL_SETUP.md`)_  
- Supabase `arbol-kg-staging`: https://supabase.com/dashboard/project/yevtcxmusooynydsygng  
- API URL: `https://yevtcxmusooynydsygng.supabase.co`  

---

## 10. Mensaje corto para WhatsApp / mail

> Cada uno usa la IA que quiera (yo Cursor, ustedes Claude si prefieren).  
> Código → GitHub. Ver avance → link de Vercel. Datos → Supabase nuevo (no VASTO).  
> Personas por DNI, empresas por CUIT. Cada uno en su carpeta. Sin reuniones.

---

*Versión Día 0 — Árbol Knowledge Graph*
