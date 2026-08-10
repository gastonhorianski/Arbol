# Árbol — Guía corta del equipo

Leé esto una vez. Después trabajamos cada uno a su ritmo.

---

## De qué se trata este proyecto

Queremos armar un **mapa de conexiones** del sistema político y económico.

La idea es poder ver, en una sola red:

1. **Personas** — políticos, funcionarios y sus familiares  
2. **Empresas / proveedores** — quién es dueño, director, socio o cobró al Estado  
3. **Pagos y subsidios** — plata pública que llegó a esas empresas o personas  

Así se puede seguir el hilo: *persona → familia → empresa → plata pública*.

No es solo una planilla. Es un **mapa de relaciones** para investigar y explicar cómo se conectan esos puntos.

---

## Primera fuente de datos (para empezar)

**Título:** Balance 2025 de Municipalidad de Posadas

Ya tenemos un trabajo previo con fotos del balance municipal 2025 (sacadas con celular) y texto leído por OCR.

**Qué sí podemos usar con confianza:**
- Nombres de **proveedores / empresas**
- Nombres de **personas** que aparecen en esos registros

**Qué hay que verificar antes de darlo por cerrado:**
- Los **montos** (plata). La lectura automática desde fotos de celular tiene errores.  
  Regla: si un monto importa para publicar o afirmar algo, **se contrasta con la foto original**.

En resumen: esta fuente nos sirve mucho para armar la red de quién aparece; los importes van con bandera de “revisar contra foto”.

---

## Cómo trabajamos entre nosotros

Somos pocos, casi no tenemos reuniones, y cada uno usa su tiempo libre.

Por eso la regla es simple:

> **Cada uno usa la IA que le resulte cómoda. El trabajo se junta en los mismos lugares.**

Podés usar Claude, Cursor, ChatGPT u otra. No importa cuál.

Lo que sí compartimos son estos 3 lugares:

| Nombre | Qué es, en criollo |
| --- | --- |
| **GitHub** | La carpeta compartida del código |
| **Vercel** | El link para **ver** el avance en internet, sin instalar nada |
| **Supabase** | La base de datos compartida (donde viven personas, empresas, vínculos y pagos) |

---

## Links del proyecto

- **Ver la web ahora:** https://arbol-eight.vercel.app  
- **Código en GitHub:** https://github.com/gastonhorianski/Arbol  
- **Base de datos (Supabase):** https://supabase.com/dashboard/project/yevtcxmusooynydsygng  

Si querés ver “cómo va quedando”, abrí el link de Vercel. Ese es nuestro tablero.

---

## Cómo es un día de trabajo típico

1. Abrís el proyecto (o pedile a tu IA que trabaje sobre el repo).  
2. Tocás **solo tu parte** (abajo te decimos cuál).  
3. Subís el cambio a GitHub en una **rama** (una copia de trabajo, no la versión principal).  
4. Pedís incorporar el cambio (**Pull Request**).  
5. Vercel te da un **link preview**. Ese link se lo mandás al resto.  
6. Si está bien, se mezcla a la versión principal y queda visible para todos.

Sin reunión: **el link preview es la reunión**.

---

## Regla más importante de los datos

Los nombres se escriben de mil formas distintas (“Martín Pérez”, “M. Pérez”, etc.).  
Para no duplicar gente ni empresas:

- **Persona** → se identifica por **DNI** (si lo tenemos)  
- **Empresa** → se identifica por **CUIT** (si lo tenemos)  
- El **nombre** es solo la etiqueta que se muestra  

Si no hay DNI o CUIT, **no inventarlo**. Se deja vacío y se anota de dónde salió el dato (fuente, foto, fecha).

Para el Balance 2025 Posadas: anotar siempre la fuente y, si hay monto, marcar si ya fue **verificado contra foto** o no.

---

## Para no pisarnos el trabajo

Cada uno tiene una zona:

| Quién | De qué se ocupa | Mejor no tocar |
| --- | --- | --- |
| Persona A | Pantalla del mapa y fichas | La estructura de la base |
| Persona B | Estructura de la base de datos | El diseño visual del mapa |
| Persona C | Cargar / limpiar datos de fuentes | La pantalla |

Si tu IA quiere cambiar algo fuera de tu zona, paramos y avisamos por mensaje.

---

## Qué pedirle a tu IA (frase útil)

Podés copiar esto cuando empieces:

> Estamos en el proyecto Árbol (GitHub: gastonhorianski/Arbol).  
> Es un mapa de políticos, familiares, empresas y plata pública.  
> Primera fuente: Balance 2025 de Municipalidad de Posadas.  
> Proveedores y personas: útiles. Montos: verificar contra fotos (OCR con errores).  
> Personas por DNI, empresas por CUIT. No inventar documentos.  
> Trabajá solo en mi carpeta / mi parte.

---

## Primer paso para vos

1. Leé esta guía.  
2. Abrí el link de Vercel y mirá lo que hay hoy.  
3. Pedí acceso al repo de GitHub si todavía no lo tenés.  
4. Decime qué parte querés tomar (pantalla, base o datos).  

Con eso ya podemos avanzar.

---

*Árbol — guía del equipo*
