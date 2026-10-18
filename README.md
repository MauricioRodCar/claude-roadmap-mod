# Roadmap: un mod para Claude Code

Una barra lateral donde Claude desglosa la tarea que le pediste y va marcando su avance, en lugar de narrar cada paso en el chat.

- **Pasos con estado:** ○ pendiente, ◐ en curso, ● hecho, ✕ bloqueado, – omitido.
- **Porcentaje de avance** con barra de progreso y "N/M pasos".
- **Entradas y salidas** de cada paso, resumidas en pocas palabras.
- **Detalle al hacer click** en un paso: qué se hizo, decisiones, comandos y archivos, en markdown.

## Instalación

En la línea de comandos de una sesión de Claude Code en la terminal:

```
/plugin install roadmap --marketplace MauricioRodCar/claude-roadmap-mod
```

Responde `y` para añadir el marketplace y elige el alcance (el de usuario es el primero).

Desde una shell:

```bash
claude plugin install roadmap --marketplace MauricioRodCar/claude-roadmap-mod
```

En la app de escritorio, donde `/plugin` no se ejecuta: haz click en **+** junto a la caja del prompt, luego **Plugins**, **Add marketplace** con `MauricioRodCar/claude-roadmap-mod`, y después **Add plugin**.

## Uso

Pídele a Claude una tarea de varios pasos. Antes de empezar publica el plan en la barra, y la actualiza cada vez que termina un paso.

| Comando | Qué hace |
| --- | --- |
| `/roadmap` | Abre la barra lateral si la cerraste |
| `/roadmap clear` | Vacía el roadmap |

## Cómo funciona

El mod registra una herramienta, `mcp__roadmap__track`, que Claude llama con el plan o con cambios a sus pasos:

```json
{
  "title": "Añadir login",
  "steps": [
    { "id": "1", "t": "Leer el código", "in": ["src/"], "out": ["mapa de auth"] },
    { "id": "2", "t": "Escribir el formulario" }
  ]
}
```

- **Con `title`:** reemplaza el plan.
- **Sin `title`:** aplica parches por `id` a uno o varios pasos. Un `id` nuevo se añade al final.
- **Avance automático:** si ningún paso está en curso, el primer pendiente pasa a en curso. Basta una llamada por paso terminado.
- **Claves:** `t` es el título, `s` el estado (`todo`, `doing`, `done`, `blocked`, `skip`), `in` y `out` las entradas y salidas, `d` el detalle en markdown.

También añade al system prompt una guía breve que le indica a Claude cuándo y cómo usar la barra. Solo se añade donde la herramienta está disponible.

### Pensado para gastar pocos tokens

- Una sola herramienta, con claves cortas.
- La respuesta de la herramienta es solo `ok 2/5`.
- La barra se dibuja en el cliente y no consume tokens.

## Desarrollo

```
.claude-plugin/plugin.json       manifiesto
.claude-plugin/marketplace.json  marketplace de este repositorio
hooks/hooks.json                 apunta al módulo de hooks
hooks/register.tsx               herramienta, guía, comando y barra lateral
types/index.d.ts                 contrato del estado ($.state)
tests/roadmap.test.ts            tests
```

Para probarlo desde una copia local:

```bash
claude --plugin-dir ./claude-roadmap-mod
```

Para validarlo y correr los tests:

```bash
claude plugin validate .
```

```bash
claude plugin test .
```

Claude Code genera los tipos en `.claude-plugin/types/` al cargar el mod (ese directorio está en `.gitignore`). Con ellos, `tsc -p .` revisa los tipos.

> La API de mods de Claude Code está en acceso anticipado y puede cambiar entre versiones.

## Licencia

[MIT](LICENSE)
