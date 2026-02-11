import ReactNativeHapticFeedback, {
  HapticFeedbackTypes,
} from "react-native-haptic-feedback"

const trigger = (type: HapticFeedbackTypes) => {
  ReactNativeHapticFeedback.trigger(type, {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
  })
}

export const haptics = {
  success: () => trigger(HapticFeedbackTypes.notificationSuccess),
  warning: () => trigger(HapticFeedbackTypes.notificationWarning),
  error: () => trigger(HapticFeedbackTypes.notificationError),
  light: () => trigger(HapticFeedbackTypes.impactLight),
  medium: () => trigger(HapticFeedbackTypes.impactMedium),
  heavy: () => trigger(HapticFeedbackTypes.impactHeavy),
  selection: () => trigger(HapticFeedbackTypes.selection),
}
