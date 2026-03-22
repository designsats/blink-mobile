import LottieView from "lottie-react-native"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { Animated, BackHandler, Dimensions, View } from "react-native"
import ReactNativeHapticFeedback from "react-native-haptic-feedback"

import errored from "@app/assets/animations/error.json"
import lnSuccess from "@app/assets/animations/lightning_success.json"
import onchainSuccess from "@app/assets/animations/onchain_success.json"
import pendingState from "@app/assets/animations/pending_state.json"
import { GaloyPrimaryButton } from "@app/components/atomic/galoy-primary-button"
import { GaloySecondaryButton } from "@app/components/atomic/galoy-secondary-button"
import { Screen } from "@app/components/screen"
import { PaymentSendResult } from "@app/graphql/generated"
import { useI18nContext } from "@app/i18n/i18n-react"
import { RootStackParamList } from "@app/navigation/stack-param-lists"
import { logPaymentAttempt, logPaymentResult } from "@app/utils/analytics"
import {
  formatTimeToMempool,
  timeToMempool,
} from "../transaction-detail-screen/format-time"
import crashlytics from "@react-native-firebase/crashlytics"
import { CommonActions, RouteProp, useNavigation } from "@react-navigation/native"
import { StackNavigationProp } from "@react-navigation/stack"
import { makeStyles, Text, useTheme } from "@rn-vui/themed"

import { useSendPayment } from "./use-send-payment"
import { useSaveLnAddressContact } from "./use-save-lnaddress-contact"

const MIN_ANIMATION_TIME_MS = 1500

// Animation state machine:
// SENDING (loops until result) → LN_SUCCESS | ONCHAIN_SUCCESS | ONCHAIN_PENDING | ERRORED
const animationMap = {
  SENDING: pendingState,
  LN_SUCCESS: lnSuccess,
  ONCHAIN_SUCCESS: onchainSuccess,
  ONCHAIN_PENDING: pendingState,
  ERRORED: errored,
}
type PaymentAnimationState = keyof typeof animationMap

const finalStates: PaymentAnimationState[] = [
  "LN_SUCCESS",
  "ONCHAIN_SUCCESS",
  "ONCHAIN_PENDING",
  "ERRORED",
]

const calculateScale = () => {
  const screen = Dimensions.get("window")
  const screenAspectRatio = screen.width / screen.height
  const animationAspectRatio = 9 / 16
  return screenAspectRatio > animationAspectRatio
    ? screen.width / (screen.height * animationAspectRatio)
    : screen.height / (screen.width / animationAspectRatio)
}

type StatusProcessed = "SUCCESS" | "PENDING" | "QUEUED"

const processStatus = ({
  status,
  arrivalAtMempoolEstimate,
}: {
  status: "SUCCESS" | "PENDING"
  arrivalAtMempoolEstimate: number | undefined
}): StatusProcessed => {
  if (status === "SUCCESS") return "SUCCESS"
  return arrivalAtMempoolEstimate ? "QUEUED" : "PENDING"
}

type Props = {
  route: RouteProp<RootStackParamList, "sendBitcoinPayment">
}

const SendBitcoinPaymentScreen: React.FC<Props> = ({ route }) => {
  const { LL, locale } = useI18nContext()
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "sendBitcoinPayment">>()
  const styles = useStyles()
  const {
    theme: { colors },
  } = useTheme()

  const pendingColorFilters = [
    { keypath: "Circle 2", color: colors.grey3 },
    { keypath: "Pulse 2", color: colors.grey3 },
    { keypath: "Pulse 3", color: colors.grey3 },
    { keypath: "Pulse 4", color: colors.grey3 },
    { keypath: "Pulse 5", color: colors.grey3 },
    { keypath: "minute Hand 2", color: colors.white },
    { keypath: "Hour Hand", color: colors.white },
  ]

  const {
    paymentDetail,
    currencyAmount,
    satAmount,
    currencyFeeAmount,
    satFeeAmount,
    destination,
    paymentType,
  } = route.params

  const { sendPayment } = useSendPayment(paymentDetail.sendPaymentMutation)
  const saveLnAddressContact = useSaveLnAddressContact()

  const [paymentAnimationState, setPaymentAnimationState] =
    useState<PaymentAnimationState>("SENDING")

  type PaymentResultType = Awaited<ReturnType<NonNullable<typeof sendPayment>>>
  const [paymentResult, setPaymentResult] = useState<PaymentResultType | null>(null)

  const fadeAnim = useRef(new Animated.Value(0)).current

  // Kick off payment immediately on mount
  useEffect(() => {
    if (!sendPayment) return
    ;(async () => {
      try {
        logPaymentAttempt({
          paymentType: paymentDetail.paymentType,
          sendingWallet: paymentDetail.sendingWalletDescriptor.currency,
        })
        const result = await sendPayment()
        logPaymentResult({
          paymentType: paymentDetail.paymentType,
          paymentStatus: result.status,
          sendingWallet: paymentDetail.sendingWalletDescriptor.currency,
        })
        setPaymentResult(result)
      } catch (err) {
        if (err instanceof Error) {
          crashlytics().recordError(err)
          const isIdempotencyError = /409: Conflict/i.test(err.message)
          setPaymentResult({
            status: isIdempotencyError
              ? PaymentSendResult.AlreadyPaid
              : PaymentSendResult.Failure,
            errorsMessage: isIdempotencyError
              ? LL.SendBitcoinConfirmationScreen.paymentAlreadyAttempted()
              : err.message,
            extraInfo: undefined,
            transaction: null,
          })
        }
      }
    })()
    // sendPayment is stable after mount — intentionally run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // After success animation, save contact and go to receipt screen
  const navigateToCompleted = useCallback(async () => {
    if (!paymentResult) return
    const { status, extraInfo, transaction } = paymentResult

    await saveLnAddressContact({
      paymentType: paymentDetail.paymentType,
      destination: paymentDetail.destination,
      isMerchant:
        paymentDetail.paymentType === "lnurl" ? paymentDetail.isMerchant : undefined,
    })

    navigation.dispatch((state) => {
      const routes = [
        { name: "Primary" },
        {
          name: "sendBitcoinCompleted",
          params: {
            arrivalAtMempoolEstimate: extraInfo?.arrivalAtMempoolEstimate,
            status,
            successAction: paymentDetail?.successAction,
            preimage: extraInfo?.preimage,
            currencyAmount,
            satAmount,
            currencyFeeAmount,
            satFeeAmount,
            destination,
            paymentType,
            createdAt: transaction?.createdAt,
            skipSuccessIcon: true,
          },
        },
      ]
      return CommonActions.reset({ ...state, routes, index: routes.length - 1 })
    })
  }, [
    paymentResult,
    navigation,
    paymentDetail,
    saveLnAddressContact,
    currencyAmount,
    satAmount,
    currencyFeeAmount,
    satFeeAmount,
    destination,
    paymentType,
  ])

  // Fade in text and actions when a final animation state is reached
  useEffect(() => {
    if (!finalStates.includes(paymentAnimationState)) return

    const fadeTimer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }).start()
    }, 1500)

    // Auto-navigate to completed screen after success animations finish
    let navTimer: ReturnType<typeof setTimeout> | undefined
    if (
      paymentAnimationState === "LN_SUCCESS" ||
      paymentAnimationState === "ONCHAIN_SUCCESS" ||
      paymentAnimationState === "ONCHAIN_PENDING"
    ) {
      navTimer = setTimeout(() => {
        navigateToCompleted()
      }, 3500)
    }

    return () => {
      clearTimeout(fadeTimer)
      if (navTimer) clearTimeout(navTimer)
    }
  }, [fadeAnim, paymentAnimationState, navigateToCompleted])

  // Animation controller: transitions SENDING → result states, with minimum duration guard
  const startTime = useRef(Date.now())
  useEffect(() => {
    if (!paymentResult || paymentAnimationState !== "SENDING") return

    const handleUpdate = () => {
      const { status, extraInfo } = paymentResult
      if (
        status === PaymentSendResult.Success ||
        status === PaymentSendResult.Pending
      ) {
        ReactNativeHapticFeedback.trigger("notificationSuccess", {
          ignoreAndroidSystemSettings: true,
        })
        const arrivalAtMempoolEstimate = extraInfo?.arrivalAtMempoolEstimate
        const processedStatus = processStatus({
          arrivalAtMempoolEstimate,
          status: status === PaymentSendResult.Success ? "SUCCESS" : "PENDING",
        })
        setPaymentAnimationState(
          processedStatus === "QUEUED"
            ? "ONCHAIN_SUCCESS"
            : processedStatus === "PENDING"
              ? "ONCHAIN_PENDING"
              : "LN_SUCCESS",
        )
      } else {
        ReactNativeHapticFeedback.trigger("notificationError", {
          ignoreAndroidSystemSettings: true,
        })
        setPaymentAnimationState("ERRORED")
      }
    }

    const timeElapsed = Date.now() - startTime.current
    if (timeElapsed < MIN_ANIMATION_TIME_MS) {
      const t = setTimeout(handleUpdate, MIN_ANIMATION_TIME_MS - timeElapsed)
      return () => clearTimeout(t)
    }
    handleUpdate()
  }, [paymentResult, paymentAnimationState])

  // Block hardware back button while animation is in progress
  useEffect(() => {
    if (finalStates.includes(paymentAnimationState)) return
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => true)
    return () => backHandler.remove()
  }, [paymentAnimationState])

  const isErrored = paymentAnimationState === "ERRORED"
  const isAlreadyPaid = paymentResult?.status === PaymentSendResult.AlreadyPaid
  const isFinalState = finalStates.includes(paymentAnimationState)

  const getStatusText = (): string => {
    if (isErrored) {
      if (!paymentResult) return LL.SendBitcoinConfirmationScreen.somethingWentWrong()
      if (isAlreadyPaid) return LL.SendBitcoinConfirmationScreen.invoiceAlreadyPaid()
      const msg = (paymentResult.errorsMessage ?? "").toLowerCase()
      if (msg.includes("no route") || msg.includes("route not found"))
        return "No route found to complete this payment. The recipient may be offline or unreachable."
      if (msg.includes("invoice expired") || msg.includes("expir"))
        return "This invoice has expired. Please request a new one from the recipient."
      if (msg.includes("insufficient"))
        return "Insufficient balance to complete this payment."
      if (msg.includes("timeout") || msg.includes("timed out"))
        return "The payment timed out. Please try again."
      return LL.SendBitcoinConfirmationScreen.somethingWentWrong()
    }

    if (!paymentResult) return ""
    const { status, extraInfo } = paymentResult
    const processed = processStatus({
      status: status === PaymentSendResult.Success ? "SUCCESS" : "PENDING",
      arrivalAtMempoolEstimate: extraInfo?.arrivalAtMempoolEstimate,
    })
    if (processed === "SUCCESS") return LL.SendBitcoinScreen.success()
    if (processed === "PENDING") return LL.SendBitcoinScreen.pendingPayment()
    return LL.TransactionDetailScreen.txNotBroadcast({
      countdown: formatTimeToMempool(
        timeToMempool(extraInfo!.arrivalAtMempoolEstimate as number),
        LL,
        locale,
      ),
    })
  }

  return (
    <Screen headerShown={false}>
      {/* Full-screen animation layers — only the active state is visible */}
      <View style={styles.animContainer}>
        {Object.entries(animationMap).map(([state, source]) => (
          <LottieView
            key={state}
            style={[
              styles.animView,
              paymentAnimationState !== state && styles.hidden,
            ]}
            source={source}
            autoPlay={paymentAnimationState === state}
            loop={state === "SENDING" || state === "ONCHAIN_PENDING"}
            colorFilters={
              state === "SENDING" || state === "ONCHAIN_PENDING"
                ? pendingColorFilters
                : undefined
            }
          />
        ))}
      </View>

      {/* Status text — fades in when final animation state is reached */}
      <Animated.View style={[styles.txInfo, { opacity: fadeAnim }]}>
        {isFinalState && (
          <Text type="p1" style={styles.centerText}>
            {getStatusText()}
          </Text>
        )}
      </Animated.View>

      {/* Error action buttons — fade in after text animation */}
      {isErrored && (
        <Animated.View style={[styles.errorActions, { opacity: fadeAnim }]}>
          {!isAlreadyPaid && (
            <GaloySecondaryButton
              containerStyle={styles.buttonSpacing}
              title={LL.common.tryAgain()}
              onPress={() => navigation.goBack()}
            />
          )}
          <GaloyPrimaryButton
            title={LL.HomeScreen.title()}
            onPress={() =>
              navigation.dispatch(
                CommonActions.reset({ index: 0, routes: [{ name: "Primary" }] }),
              )
            }
          />
        </Animated.View>
      )}
    </Screen>
  )
}

const useStyles = makeStyles(() => ({
  animContainer: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  animView: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transform: [{ scale: calculateScale() }],
  },
  hidden: {
    width: 0,
    height: 0,
    position: "absolute",
    opacity: 0,
  },
  txInfo: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 50,
  },
  centerText: {
    textAlign: "center",
    lineHeight: 35,
  },
  errorActions: {
    position: "absolute",
    bottom: 48,
    left: 16,
    right: 16,
  },
  buttonSpacing: {
    marginBottom: 12,
  },
}))

export default SendBitcoinPaymentScreen
