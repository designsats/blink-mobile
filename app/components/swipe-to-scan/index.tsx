import React from "react"
import { useWindowDimensions } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import { makeStyles, useTheme } from "@rn-vui/themed"

import { haptics } from "@app/utils/haptics"

const ACTIVATION_OFFSET_X = 25
const FAIL_OFFSET_Y = 15
const SWIPE_THRESHOLD_DISTANCE = 80
const SWIPE_THRESHOLD_VELOCITY = 500
const EDGE_DEAD_ZONE = 40
const INDICATOR_SIZE = 30

type SwipeToScanProps = {
  onSwipeComplete: () => void
  enabled?: boolean
  children: React.ReactNode
}

const SwipeToScan: React.FC<SwipeToScanProps> = ({
  onSwipeComplete,
  enabled = true,
  children,
}) => {
  const {
    theme: { colors },
  } = useTheme()
  const styles = useStyles()
  const { width: windowWidth } = useWindowDimensions()

  const translateX = useSharedValue(0)
  const screenWidth = useSharedValue(windowWidth)
  screenWidth.value = windowWidth
  const isEdgeGesture = useSharedValue(false)
  const hasPassedThreshold = useSharedValue(false)

  const triggerThresholdHaptic = () => haptics.selection()
  const triggerCompleteHaptic = () => haptics.light()

  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-ACTIVATION_OFFSET_X, ACTIVATION_OFFSET_X])
    .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
    .onBegin((event) => {
      isEdgeGesture.value =
        event.absoluteX < EDGE_DEAD_ZONE ||
        event.absoluteX > screenWidth.value - EDGE_DEAD_ZONE
      hasPassedThreshold.value = false
    })
    .onUpdate((event) => {
      if (isEdgeGesture.value) return
      if (event.translationX >= 0) {
        translateX.value = 0
        return
      }

      const distance = Math.abs(event.translationX)
      translateX.value = -Math.min(distance, SWIPE_THRESHOLD_DISTANCE * 1.5)

      if (distance >= SWIPE_THRESHOLD_DISTANCE && !hasPassedThreshold.value) {
        hasPassedThreshold.value = true
        runOnJS(triggerThresholdHaptic)()
      } else if (distance < SWIPE_THRESHOLD_DISTANCE) {
        hasPassedThreshold.value = false
      }
    })
    .onEnd((event) => {
      if (isEdgeGesture.value) {
        translateX.value = withSpring(0)
        return
      }

      const distanceSwiped = Math.abs(event.translationX)
      const velocityLeft = -event.velocityX

      const shouldComplete =
        distanceSwiped >= SWIPE_THRESHOLD_DISTANCE ||
        (distanceSwiped > 30 && velocityLeft > SWIPE_THRESHOLD_VELOCITY)

      if (shouldComplete) {
        runOnJS(triggerCompleteHaptic)()
        runOnJS(onSwipeComplete)()
      }

      translateX.value = withSpring(0)
    })
    .onFinalize(() => {
      translateX.value = withSpring(0)
    })

  const indicatorStyle = useAnimatedStyle(() => {
    const active = -translateX.value > 10

    return {
      opacity: active ? 0.5 : 0,
      transform: [
        { scale: active ? withSpring(1, { damping: 12, stiffness: 400 }) : 0 },
      ],
    }
  })

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={styles.container}>
        {children}
        <Animated.View
          style={[
            styles.indicator,
            { backgroundColor: colors.black },
            indicatorStyle,
          ]}
        />
      </Animated.View>
    </GestureDetector>
  )
}

const useStyles = makeStyles(() => ({
  container: {
    flex: 1,
  },
  indicator: {
    position: "absolute",
    right: 20,
    top: "50%",
    marginTop: -INDICATOR_SIZE / 2,
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
  },
}))

export default SwipeToScan
