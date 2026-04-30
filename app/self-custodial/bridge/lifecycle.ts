import {
  Seed,
  connect,
  defaultConfig,
  initLogging,
  type BreezSdkInterface,
  type SdkEvent,
} from "@breeztech/breez-sdk-spark-react-native"
import { generateMnemonic } from "bip39"
import Crypto from "react-native-quick-crypto"

import KeyStoreWrapper from "@app/utils/storage/secureStorage"

import { SparkConfig, SparkNetworkLabel, SparkToken } from "../config"
import { createSdkLogListener } from "../logging"
import { addSelfCustodialAccountId } from "../storage/account-index"

const initializeLogging = (() => {
  let done = false
  return () => {
    if (done) return
    done = true
    try {
      initLogging(undefined, createSdkLogListener(), undefined)
    } catch {
      // initLogging can fail if called after SDK state changes; non-fatal
    }
  }
})()

const createSdkConfig = () => {
  const config = defaultConfig(SparkConfig.network)
  config.apiKey = SparkConfig.apiKey

  if (SparkConfig.tokenIdentifier) {
    config.stableBalanceConfig = {
      tokens: [{ label: SparkToken.Label, tokenIdentifier: SparkConfig.tokenIdentifier }],
      defaultActiveLabel: undefined,
      thresholdSats: undefined,
      maxSlippageBps: SparkConfig.maxSlippageBps,
    }
  }

  return config
}

export const initSdk = async (
  mnemonic: string,
  storageDir: string = SparkConfig.storageDir,
): Promise<BreezSdkInterface> => {
  initializeLogging()
  const seed = new Seed.Mnemonic({ mnemonic, passphrase: undefined })
  const config = createSdkConfig()
  return connect({ config, seed, storageDir })
}

export const disconnectSdk = async (sdk: BreezSdkInterface): Promise<void> => {
  await sdk.disconnect()
}

export const addSdkEventListener = (
  sdk: BreezSdkInterface,
  onEvent: (event: SdkEvent) => Promise<void>,
) => sdk.addEventListener({ onEvent })

export const removeSdkEventListener = (sdk: BreezSdkInterface, listenerId: string) =>
  sdk.removeEventListener(listenerId)

export const selfCustodialCreateWallet = async (accountId: string): Promise<void> => {
  const mnemonic = generateMnemonic(128, (size: number) =>
    Buffer.from(Crypto.randomBytes(size)),
  )
  if (!mnemonic) throw new Error("Failed to generate mnemonic")

  const stored = await KeyStoreWrapper.setMnemonicForAccount(accountId, mnemonic)
  if (!stored) throw new Error("Failed to store mnemonic")

  await KeyStoreWrapper.setMnemonicNetworkForAccount(accountId, SparkNetworkLabel)
  await addSelfCustodialAccountId(accountId)
}

export const selfCustodialRestoreWallet = async (
  accountId: string,
  mnemonic: string,
): Promise<void> => {
  const stored = await KeyStoreWrapper.setMnemonicForAccount(accountId, mnemonic)
  if (!stored) throw new Error("Failed to store mnemonic")

  await KeyStoreWrapper.setMnemonicNetworkForAccount(accountId, SparkNetworkLabel)
  await addSelfCustodialAccountId(accountId)
}
