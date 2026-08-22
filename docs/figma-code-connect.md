# Figma ↔ Code Connect

How Figma components map to Blink's RN components, how to build screens from Figma
fast, and how to extend the mapping.

**Figma file:** [Blink](https://www.figma.com/design/9MQuQi8ZhXVvDibWSI3C4c/Blink) —
component library lives on the **🧩 Components** canvas (`37:4625`).

## Current state

| What | Where | Status |
|------|-------|--------|
| 613 icon variants → `GaloyIcon` | Figma file (MCP simple mappings) | ✅ live |
| button-primary / button-secondary / button-tertiary / icon-button / input (all variants) | Figma file (MCP simple mappings) | ✅ live |
| Prop-aware templates for the 4 pilot components | `app/components/atomic/*/.figma.ts` | ✅ written, unpublished |
| `figma.config.json` + `tsconfig.figma.json` | repo root | ✅ |
| Semantic components (header, row, bottom-bar, …) | — | ⬜ not mapped |

Two mechanisms coexist:

1. **Simple mappings** (stored in the Figma file) — tell Dev Mode and the Figma MCP
   server *which* RN component a Figma component is, with its source path. Created via
   the `send_code_connect_mappings` MCP tool. No repo changes needed.
2. **Template files** (`.figma.ts`, in this repo) — additionally describe *which props*
   to render (e.g. `title` from the Figma `Text` property). Version-controlled,
   PR-reviewable, published with the Code Connect CLI. Templates win over simple
   mappings when both exist.

## Building a screen from Figma (the fast path)

With an MCP-connected Figma desktop app and an AI agent:

1. Open the screen/frame in Figma desktop.
2. Give the agent the Figma URL (or select the frame).
3. The agent calls `get_design_context`; every mapped component resolves to its real
   Blink import + usage instead of generic JSX.
4. Unmapped regions come back as raw layout — the agent composes them from
   `app/components/` manually.

Rules that still apply to generated screens (see AGENTS.md):

- All user-facing strings via typesafe-i18n, never literals from the design.
- Colors come from `useTheme()` tokens — **the whole Figma library is drawn in dark
  mode**, never hardcode a Figma hex value.
- Screens are composed from `app/components/`, wrapped in `components/screen`.

## Manual Figma renames (align names 1:1 with code)

Renames are safe: mappings key off node IDs, not names. Do these directly on the
🧩 Components canvas. Ambiguous cases (Badge, header, row, banners, …) are
intentionally excluded — pending a ruling.

| Figma name (current) | Code component | Rename Figma to |
|----------------------|----------------|-----------------|
| `Icon` | `atomic/galoy-icon` | `galoy-icon` |
| `button-primary` | `atomic/galoy-primary-button` | `galoy-primary-button` |
| `button-secondary` | `atomic/galoy-secondary-button` | `galoy-secondary-button` |
| `button-tertiary` | `atomic/galoy-tertiary-button` | `galoy-tertiary-button` |
| `icon-button` | `atomic/galoy-icon-button` | `galoy-icon-button` |
| `input` | `atomic/galoy-input` | `galoy-input` |
| `text-icon-button` ⚠ word order | `icon-text-button` | `icon-text-button` |
| `Slider` | `atomic/galoy-slider-button` | `galoy-slider-button` |
| `Toggle` | `atomic/switch` | `switch` |
| `currencyPill` | `atomic/currency-pill` | `currency-pill` |
| `error-box` | `atomic/galoy-error-box` | `galoy-error-box` |
| `info` | `atomic/galoy-info` | `galoy-info` |
| `CTA-button-group` | `button-group` | `button-group` |
| `skelleton` (typo) | RNE `Skeleton` | `skeleton` |
| `QRs` | `qr-carousel` | `qr-carousel` |

Figma hygiene, regardless of mapping: name or drop `Group 697`, `Group 685`,
`label`; `light mode`, `statusbar-placeholder`, `options` are not real components.

## Adding a new mapping

### 1. Simple mapping (30 seconds, no PR)

With the Figma MCP connected, ask the agent:

> Map Figma node `<url>` to `<ComponentName>` at `app/components/<dir>/<file>.tsx`

It calls `send_code_connect_mappings` with `label: "React"`. **The tool often reports
spurious "Failed to map" errors — always verify with `get_code_connect_map` afterwards.**

### 2. Template file (props in generated code, needs PR)

Create `<component>.figma.ts` next to the component:

```ts
// url=https://www.figma.com/design/9MQuQi8ZhXVvDibWSI3C4c/Blink?node-id=<component-node-id>
// source=app/components/atomic/galoy-primary-button/galoy-primary-button.tsx
// component=GaloyPrimaryButton
import figma from "figma"

const instance = figma.selectedInstance
const title = instance.getString("Text")

export default {
  example: figma.code`<GaloyPrimaryButton title={${title}} />`,
  imports: [
    'import { GaloyPrimaryButton } from "@app/components/atomic/galoy-primary-button"',
  ],
  id: "galoy-primary-button",
  metadata: { nestable: true },
}
```

- The Figma component's properties are readable via `instance.getString("Text")`,
  `instance.getBoolean("Disabled")`, `instance.getEnum("Size", { ... })`. Property
  names must match Figma exactly (case-sensitive).
- Map **app props as they ship today** — app code wins over the design spec when they
  disagree (e.g. button font weight 600, not 700).
- State variants that are runtime concerns (pressed, focused) map to the default
  snippet; `disabled` / `loading` map to the real props.

Validate locally (no token needed):

```bash
npx figma connect parse --file app/components/<dir>/<file>.figma.ts
yarn tsc -p tsconfig.figma.json   # typecheck templates only
```

Note: `**/*.figma.ts` is **excluded from the main `tsconfig.json`** on purpose — the
`figma-types` package declares a global `require` that breaks jest's
`require.resolve` in tests. Templates are typechecked by `tsconfig.figma.json`.

### 3. Publishing templates (needs a Figma token)

```bash
export FIGMA_ACCESS_TOKEN=<personal access token with Code Connect scope>
npx figma connect publish        # publish all *.figma.ts
npx figma connect unpublish      # remove them again
```

Never commit the token. For experiments, set `"label": "TEST"` in `figma.config.json`
first, publish, verify in Dev Mode, unpublish, then publish under the real `React`
label.

## Notes on the `@figma/code-connect` devDependency

- Dev-only: never imported by app code, never in the Metro bundle — zero runtime
  exposure for users.
- Installed with `--ignore-scripts`; version pinned by `yarn.lock`.
- Zero-install alternative: `npx --yes --package @figma/code-connect figma connect publish`.
- `parse` and local validation need no token; only `publish`/`unpublish` do.
- Publishing writes Code Connect state into the shared Figma file — use the `TEST`
  label until a template is proven.

## Known gaps (do not map blindly)

- Figma `Line` (separator) — no code component exists; only ad-hoc styles.
- Figma bare `checkbox` — code only has `checkbox-row`.
- Figma `bottom-sheet` — no shared bottom-sheet component in the app.
- Figma `bottom-bar` — lives in `app/navigation/root-navigator.tsx`, not a component.
- No canonical amount component in code (9 overlapping implementations).
