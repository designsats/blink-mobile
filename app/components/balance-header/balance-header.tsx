import * as React from "react"
import ContentLoader, { Rect } from "react-content-loader/native"
import { PixelRatio, TouchableOpacity, View, Text } from "react-native"

import { makeStyles } from "@rn-vui/themed"

import { useHideAmount } from "@app/graphql/hide-amount-context"
import { testProps } from "@app/utils/testProps"

const BASE_LOADER_HEIGHT = 40
const BASE_LOADER_WIDTH = 100

const Loader = () => {
  const styles = useStyles()
  const fontScale = PixelRatio.getFontScale()
  const loaderHeight = Math.round(BASE_LOADER_HEIGHT * fontScale)
  const loaderWidth = Math.round(BASE_LOADER_WIDTH * fontScale)
  return (
    <ContentLoader
      height={loaderHeight}
      width={loaderWidth}
      speed={1.2}
      backgroundColor={styles.loaderBackground.color}
      foregroundColor={styles.loaderForefound.color}
      viewBox={`0 0 ${loaderWidth} ${loaderHeight}`}
    >
      <Rect x="0" y="0" rx="4" ry="4" width={loaderWidth} height={loaderHeight} />
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
      {hideAmount ? (
        <TouchableOpacity onPress={switchMemoryHideAmount}>
          <Text style={styles.balanceHiddenText}>****</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={switchMemoryHideAmount}>
          <View style={styles.balanceContainer}>
            {loading ? (
              <Loader />
            ) : (
              <Text
                style={styles.primaryBalanceText}
                allowFontScaling
                adjustsFontSizeToFit
                numberOfLines={1}
              >
                {formattedBalance}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      )}
    </View>
  )
}

const fontScale = PixelRatio.getFontScale()

const useStyles = makeStyles(({ colors }) => ({
  balanceHeaderContainer: {
    alignItems: "center",
    textAlign: "center",
  },
  balanceContainer: {
    height: Math.round(BASE_LOADER_HEIGHT * fontScale),
    justifyContent: "center",
  },
  primaryBalanceText: {
    fontSize: 32,
    color: colors.black,
  },
  loaderBackground: {
    color: colors.loaderBackground,
  },
  loaderForefound: {
    color: colors.loaderForeground,
  },
  balanceHiddenText: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.black,
  },
}))
