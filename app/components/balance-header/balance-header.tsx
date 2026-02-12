import * as React from "react"
import ContentLoader, { Rect } from "react-content-loader/native"
import { TouchableOpacity, View, Text } from "react-native"

import { makeStyles } from "@rn-vui/themed"

import { HiddenBalanceIndicator } from "@app/components/hidden-balance-indicator/hidden-balance-indicator"
import { useHideAmount } from "@app/graphql/hide-amount-context"
import { testProps } from "@app/utils/testProps"

const Loader = () => {
  const styles = useStyles()
  return (
    <ContentLoader
      height={40}
      width={100}
      speed={1.2}
      backgroundColor={styles.loaderBackground.color}
      foregroundColor={styles.loaderForefound.color}
      viewBox="0 0 100 40"
    >
      <Rect x="0" y="0" rx="4" ry="4" width="100" height="40" />
    </ContentLoader>
  )
}

type Props = {
  loading: boolean
  formattedBalance?: string
}

export const BalanceHeader: React.FC<Props> = ({ loading, formattedBalance }) => {
  const styles = useStyles()

  const { hideAmount, switchMemoryHideAmount } = useHideAmount()

  // TODO: use suspense for this component with the apollo suspense hook (in beta)
  // so there is no need to pass loading from parent?
  return (
    <View {...testProps("balance-header")} style={styles.balanceHeaderContainer}>
      <TouchableOpacity onPress={switchMemoryHideAmount}>
        <View style={styles.balanceWrapper}>
          <View style={{ opacity: hideAmount ? 0 : 1 }}>
            {loading ? (
              <Loader />
            ) : (
              <Text
                style={styles.primaryBalanceText}
                allowFontScaling
                adjustsFontSizeToFit
              >
                {formattedBalance}
              </Text>
            )}
          </View>
          {hideAmount && (
            <View style={styles.indicatorOverlay}>
              <HiddenBalanceIndicator size="large" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  balanceHeaderContainer: {
    alignItems: "center",
    textAlign: "center",
  },
  balanceWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  indicatorOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  primaryBalanceText: {
    fontSize: 36,
    fontWeight: "bold",
    color: colors.black,
  },
  loaderBackground: {
    color: colors.loaderBackground,
  },
  loaderForefound: {
    color: colors.loaderForeground,
  },
}))
