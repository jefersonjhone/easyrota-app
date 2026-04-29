import React, { Children, isValidElement, type ReactNode } from "react"

export function createSlots<T extends string>(...names: T[]) {
  type SlotMap = { [K in T]: React.FC<{ children?: ReactNode }> }

  const slots = {} as SlotMap

  for (const name of names) {
    const Comp: React.FC<{ children?: ReactNode }> = ({ children }) => <>{children}</>
    ;(Comp as any).displayName = `Slot.${name}`
    slots[name as T] = Comp
  }

  function useSlots(children?: ReactNode) {
    const arr = Children.toArray(children)
    const found = {} as { [K in T]?: ReactNode }
    const rest: ReactNode[] = []

    for (const ch of arr) {
      if (isValidElement(ch)) {
        const slotName = (Object.keys(slots) as string[]).find(
          (k) => (slots as any)[k] === ch.type,
        ) as T | undefined

        if (slotName) {
          // Prefer the first occurrence
          if (found[slotName] === undefined) found[slotName] = ch
          else rest.push(ch)
          continue
        }
      }
      rest.push(ch)
    }

    return { slots: found as { [K in T]?: ReactNode }, rest }
  }

  return { slots, useSlots }
}

export default createSlots
