import React, { useCallback, useRef, useState } from "react"
import { View } from "react-native"
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable"
import Animated, { SharedValue, useAnimatedStyle } from "react-native-reanimated"

import { GaloyIcon } from "@app/components/atomic/galoy-icon"
import { GaloyIconButton } from "@app/components/atomic/galoy-icon-button"
import CustomModal from "@app/components/custom-modal/custom-modal"
import { UserContact } from "@app/graphql/generated"
import { useAppConfig } from "@app/hooks"
import { useI18nContext } from "@app/i18n/i18n-react"
import { useDeletedContacts } from "@app/store/deleted-contacts/deleted-contacts-context"
import { makeStyles, Text, useTheme } from "@rn-vui/themed"

const ACTION_WIDTH = 70

type Props = {
  contact: UserContact
  children: React.ReactNode
}

const RightActions = ({
  drag,
  onPress,
  colors,
}: {
  drag: SharedValue<number>
  onPress: () => void
  colors: { error: string; error9: string }
}) => {
  const styles = useStyles()

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + ACTION_WIDTH }],
  }))

  return (
    <Animated.View style={[styles.deleteButtonWrapper, animatedStyle]}>
      <GaloyIconButton
        name="trash"
        size="large"
        color={colors.error}
        backgroundColor={colors.error9}
        onPress={onPress}
      />
    </Animated.View>
  )
}

export const SwipeableContactRow: React.FC<Props> = ({ contact, children }) => {
  const styles = useStyles()
  const {
    theme: { colors },
  } = useTheme()
  const { LL } = useI18nContext()
  const { deleteContact } = useDeletedContacts()
  const [modalVisible, setModalVisible] = useState(false)
  const swipeableRef = useRef<React.ComponentRef<typeof ReanimatedSwipeable>>(null)

  const handleDeletePress = useCallback(() => {
    setModalVisible(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    deleteContact(contact.handle)
    setModalVisible(false)
    swipeableRef.current?.close()
  }, [contact.handle, deleteContact])

  const handleCancelDelete = useCallback(() => {
    setModalVisible(false)
    swipeableRef.current?.close()
  }, [])

  const renderRightActions = useCallback(
    (_progress: SharedValue<number>, drag: SharedValue<number>) => {
      return (
        <RightActions
          drag={drag}
          onPress={handleDeletePress}
          colors={{ error: colors.error, error9: colors.error9 }}
        />
      )
    },
    [handleDeletePress, colors.error, colors.error9],
  )

  const {
    appConfig: {
      galoyInstance: { lnAddressHostname },
    },
  } = useAppConfig()

  const handle = contact?.handle?.trim() ?? ""
  const fullHandle =
    handle && !handle.includes("@") ? `${handle}@${lnAddressHostname}` : handle

  return (
    <>
      <ReanimatedSwipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        rightThreshold={40}
      >
        {children}
      </ReanimatedSwipeable>
      <CustomModal
        isVisible={modalVisible}
        toggleModal={handleCancelDelete}
        showCloseIconButton={false}
        image={<GaloyIcon name="question" size={34} color={colors.primary3} />}
        body={
          <View style={styles.modalBody}>
            <Text style={styles.modalText}>
              {LL.PeopleScreen.deleteContactConfirmation({ username: fullHandle })}
            </Text>
          </View>
        }
        primaryButtonTitle={LL.PeopleScreen.deleteContactCancel()}
        primaryButtonOnPress={handleCancelDelete}
        secondaryButtonTitle={LL.PeopleScreen.deleteContactConfirm()}
        secondaryButtonOnPress={handleConfirmDelete}
      />
    </>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  deleteButtonWrapper: {
    width: ACTION_WIDTH,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 20,
  },
  modalBody: {
    alignItems: "center",
    paddingVertical: 10,
  },
  modalText: {
    fontSize: 18,
    textAlign: "center",
    color: colors.black,
  },
}))
