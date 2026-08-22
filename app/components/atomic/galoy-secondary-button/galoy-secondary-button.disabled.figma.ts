// url=https://www.figma.com/design/9MQuQi8ZhXVvDibWSI3C4c/Blink?node-id=6209-26430
// source=app/components/atomic/galoy-secondary-button/galoy-secondary-button.tsx
// component=GaloySecondaryButton
import figma from "figma"

const instance = figma.selectedInstance
const title = instance.getString("Text")

export default {
  example: figma.code`<GaloySecondaryButton title={${title}} disabled />`,
  imports: [
    'import { GaloySecondaryButton } from "@app/components/atomic/galoy-secondary-button"',
  ],
  id: "galoy-secondary-button-disabled",
  metadata: { nestable: true },
}
