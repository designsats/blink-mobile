// url=https://www.figma.com/design/9MQuQi8ZhXVvDibWSI3C4c/Blink?node-id=5590-17713
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
