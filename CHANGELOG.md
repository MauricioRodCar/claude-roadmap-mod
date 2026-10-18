# Changelog

## 0.2.0

- Una sola herramienta, `track`, en lugar de `set_plan` y `update_step`: con `title` reemplaza el plan; sin él aplica parches a uno o varios pasos.
- El siguiente paso pendiente pasa a "en curso" solo: una llamada por paso terminado.
- Claves y estados cortos (`t`, `s`, `in`, `out`, `d`; `todo`, `doing`, `done`, `blocked`, `skip`).
- Guía del system prompt más corta, añadida solo donde la herramienta está disponible (no en subagentes sin ella).
- Respuesta de la herramienta reducida a `ok <hechos>/<total>`.

## 0.1.0

- Primera versión: barra lateral con pasos, porcentaje de avance, entradas, salidas y detalle al hacer click.
