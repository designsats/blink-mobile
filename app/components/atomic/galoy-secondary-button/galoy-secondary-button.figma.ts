// url=https://www.figma.com/design/9MQuQi8ZhXVvDibWSI3C4c/Blink?node-id=6209-26427
// source=app/components/atomic/galoy-secondary-button/galoy-secondary-button.tsx
// component=GaloySecondaryButton
import figma from "figma"

const instance = figma.selectedInstance
const title = instance.getString("Text")
const disabled = instance.getEnum("state", { disabled: true }) ?? false

// "pressed" is a runtime interaction state handled inside the RN component
const example = disabled
  ? figma.code`<GaloySecondaryButton title={${title}} disabled />`
  : figma.code`<GaloySecondaryButton title={${title}} />`

export default {
  example,
  imports: [
    'import { GaloySecondaryButton } from "@app/components/atomic/galoy-secondary-button"',
  ],
  id: "galoy-secondary-button",
  metadata: { nestable: true },
}
