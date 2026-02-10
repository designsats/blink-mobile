import { createContext, useCallback, useContext, useEffect, useState, PropsWithChildren } from "react"
import * as React from "react"

import { loadJson, saveJson } from "@app/utils/storage"

const DELETED_CONTACTS_KEY = "deletedContacts"

type DeletedContactsContextType = {
  deleteContact: (handle: string) => void
  isDeleted: (handle: string) => boolean
}

const DeletedContactsContext = createContext<DeletedContactsContextType>({
  deleteContact: () => {},
  isDeleted: () => false,
})

export const DeletedContactsProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [deletedSet, setDeletedSet] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    ;(async () => {
      const data = await loadJson(DELETED_CONTACTS_KEY)
      if (Array.isArray(data)) {
        setDeletedSet(new Set(data))
      }
      setLoaded(true)
    })()
  }, [])

  useEffect(() => {
    if (loaded) {
      saveJson(DELETED_CONTACTS_KEY, Array.from(deletedSet))
    }
  }, [deletedSet, loaded])

  const deleteContact = useCallback((handle: string) => {
    if (!handle || handle.trim().length === 0) return
    setDeletedSet((prev) => {
      const next = new Set(prev)
      next.add(handle.trim())
      return next
    })
  }, [])

  const isDeleted = useCallback(
    (handle: string) => {
      return deletedSet.has(handle?.trim())
    },
    [deletedSet],
  )

  if (!loaded) return null

  return (
    <DeletedContactsContext.Provider value={{ deleteContact, isDeleted }}>
      {children}
    </DeletedContactsContext.Provider>
  )
}

export const useDeletedContacts = () => useContext(DeletedContactsContext)
