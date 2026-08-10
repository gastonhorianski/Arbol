# Fuente: Balance 2025 de Municipalidad de Posadas

## Qué es

Material del balance municipal 2025 de Posadas: fotos tomadas con celular + lectura OCR + listas de beneficiarios/proveedores ya procesadas.

Carpeta de origen (local, no va al repo por tamaño): `D:\Escritorio\BALANE 2025`

## Qué confiar

| Campo | Confianza | Nota |
| --- | --- | --- |
| Proveedores / empresas (nombres) | Alta | Útil para armar nodos de empresa |
| Personas (nombres) | Alta | Útil para armar nodos de persona |
| Montos | Baja hasta verificar | OCR desde fotos de celular con errores de lectura |

## Regla de carga en Árbol

1. Ingestar nombres de proveedores y personas con `source` = `Balance 2025 de Municipalidad de Posadas`.
2. Si se carga un monto, marcarlo como `amount_verified = false` hasta contrastarlo con la foto original.
3. No inventar DNI/CUIT: si no está en la fuente, queda vacío.
4. Guardar referencia a archivo/foto cuando exista (carpeta `FOTOS ...` / registro OCR).

## Archivos útiles en la carpeta origen

- `beneficiarios_raw.json` — nombres + menciones + montos OCR + conceptos
- `AUDITORIA_COMPLETA_2025.xlsx` — planilla de auditoría
- `BALANCE 2025 POSADAS.html` / `balance_data.js` — buscador/auditoría ya armada
- Carpetas `FOTOS *` — evidencia fotográfica para verificar montos
