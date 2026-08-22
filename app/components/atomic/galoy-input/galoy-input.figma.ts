// url=https://www.figma.com/design/9MQuQi8ZhXVvDibWSI3C4c/Blink?node-id=5897-12897
// source=app/components/atomic/galoy-input/galoy-input.tsx
// component=GaloyInput
import figma from "figma"

const instance = figma.selectedInstance
// The Figma "Text" is the field's content in the design; in code it becomes
// the placeholder hint until value + onChangeText are wired.
const placeholder = instance.getString("Text")
const disabled = instance.getEnum("state", { disabled: true }) ?? false

// "focused", "success" and "error" are runtime validation states, not props.
const example = disabled
  ? figma.code`<GaloyInput placeholder={${placeholder}} editable={false} />`
  : figma.code`<GaloyInput placeholder={${placeholder}} />`

export default {
  example,
  imports: ['import { GaloyInput } from "@app/components/atomic/galoy-input"'],
  id: "galoy-input",
  metadata: { nestable: true },
}
