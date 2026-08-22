// url=https://www.figma.com/design/9MQuQi8ZhXVvDibWSI3C4c/Blink?node-id=38-13802
// source=app/components/atomic/galoy-tertiary-button/galoy-tertiary-button.tsx
// component=GaloyTertiaryButton
import figma from "figma"

const instance = figma.selectedInstance
const filled = instance.getEnum("Filled", { true: true, false: false }) ?? true
const disabled = instance.getEnum("State", { Disabled: true }) ?? false

// The Figma set exposes no Text property, so the title is a placeholder.
// Figma "Filled=false" maps to the app's `clear` mode; the app's `outline`
// mode has no Figma counterpart. "Pressed" is handled inside the component.
const clear = filled ? null : figma.code` clear`
const disabledProp = disabled ? figma.code` disabled` : null

export default {
  example: figma.code`<GaloyTertiaryButton title="Button"${clear}${disabledProp} />`,
  imports: [
    'import { GaloyTertiaryButton } from "@app/components/atomic/galoy-tertiary-button"',
  ],
  id: "galoy-tertiary-button",
  metadata: { nestable: true },
}
