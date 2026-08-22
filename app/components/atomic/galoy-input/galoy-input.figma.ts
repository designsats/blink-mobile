// url=https://www.figma.com/design/9MQuQi8ZhXVvDibWSI3C4c/Blink?node-id=5897-12496
// source=app/components/atomic/galoy-input/galoy-input.tsx
// component=GaloyInput
import figma from "figma"

const instance = figma.selectedInstance
const placeholder = instance.getString("Text")

export default {
  example: figma.code`<GaloyInput placeholder={${placeholder}} />`,
  imports: ['import { GaloyInput } from "@app/components/atomic/galoy-input"'],
  id: "galoy-input",
  metadata: { nestable: true },
}
