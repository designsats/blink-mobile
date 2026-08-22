// url=https://www.figma.com/design/9MQuQi8ZhXVvDibWSI3C4c/Blink?node-id=5590-17714
// source=app/components/atomic/galoy-primary-button/galoy-primary-button.tsx
// component=GaloyPrimaryButton
import figma from "figma"

const instance = figma.selectedInstance
const title = instance.getString("Text")
const state = instance.getEnum("state", {
  disabled: "disabled",
  loading: "loading",
})

// "pressed" is a runtime interaction state handled inside the RN component
const example =
  state === "disabled"
    ? figma.code`<GaloyPrimaryButton title={${title}} disabled />`
    : state === "loading"
      ? figma.code`<GaloyPrimaryButton title={${title}} loading />`
      : figma.code`<GaloyPrimaryButton title={${title}} />`

export default {
  example,
  imports: [
    'import { GaloyPrimaryButton } from "@app/components/atomic/galoy-primary-button"',
  ],
  id: "galoy-primary-button",
  metadata: { nestable: true },
}
