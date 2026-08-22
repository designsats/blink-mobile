// url=https://www.figma.com/design/9MQuQi8ZhXVvDibWSI3C4c/Blink?node-id=38-13818
// source=app/components/atomic/galoy-tertiary-button/galoy-tertiary-button.tsx
// component=GaloyTertiaryButton
import figma from "figma"

const instance = figma.selectedInstance
const title = instance.getString("Text")

// Figma "Filled=false" maps to the app's `clear` mode (transparent, primary
// label). The app's `outline` mode has no Figma counterpart.
export default {
  example: figma.code`<GaloyTertiaryButton title={${title}} clear />`,
  imports: [
    'import { GaloyTertiaryButton } from "@app/components/atomic/galoy-tertiary-button"',
  ],
  id: "galoy-tertiary-button-clear",
  metadata: { nestable: true },
}
