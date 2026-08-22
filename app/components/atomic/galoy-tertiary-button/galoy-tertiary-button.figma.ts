// url=https://www.figma.com/design/9MQuQi8ZhXVvDibWSI3C4c/Blink?node-id=972-15001
// source=app/components/atomic/galoy-tertiary-button/galoy-tertiary-button.tsx
// component=GaloyTertiaryButton
import figma from "figma"

const instance = figma.selectedInstance
const title = instance.getString("Text")

export default {
  example: figma.code`<GaloyTertiaryButton title={${title}} />`,
  imports: [
    'import { GaloyTertiaryButton } from "@app/components/atomic/galoy-tertiary-button"',
  ],
  id: "galoy-tertiary-button",
  metadata: { nestable: true },
}
