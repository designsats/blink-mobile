// url=https://www.figma.com/design/9MQuQi8ZhXVvDibWSI3C4c/Blink?node-id=6209-26426
// source=app/components/atomic/galoy-secondary-button/galoy-secondary-button.tsx
// component=GaloySecondaryButton
import figma from "figma"

const instance = figma.selectedInstance
const title = instance.getString("Text")

export default {
  example: figma.code`<GaloySecondaryButton title={${title}} />`,
  imports: [
    'import { GaloySecondaryButton } from "@app/components/atomic/galoy-secondary-button"',
  ],
  id: "galoy-secondary-button",
  metadata: { nestable: true },
}
