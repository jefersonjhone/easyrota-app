/* eslint-disable react-refresh/only-export-components */
"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

type StepValue = string

// -----------------------------
// Context
// -----------------------------

interface StepsContextType {
  current: StepValue
  completed: StepValue[]
  goTo: (step: StepValue) => void
  markComplete: (step: StepValue) => void
  isUnlocked: (step: StepValue) => boolean
}

const StepsContext = React.createContext<StepsContextType | null>(null)

export function useSteps() {
  const ctx = React.useContext(StepsContext)
  if (!ctx) throw new Error("useSteps must be used inside <StepsRoot>")
  return ctx
}

// -----------------------------
// Root (logic + Tabs)
// -----------------------------

type StepsRootProps = {
  stepsOrder: StepValue[]
  initialStep?: StepValue
} & Omit<
  React.ComponentProps<typeof TabsPrimitive.Root>,
  "value" | "defaultValue" | "onValueChange"
>

export function StepsRoot({
  stepsOrder,
  initialStep,
  className,
  ...props
}: StepsRootProps) {
  const [current, setCurrent] = React.useState<StepValue>(
    initialStep ?? stepsOrder[0]
  )
  const [completed, setCompleted] = React.useState<StepValue[]>([])
  const completedRef = React.useRef<StepValue[]>([])

  React.useEffect(() => {
    completedRef.current = completed
  }, [completed])

  const isUnlocked = (step: StepValue, completedSteps = completedRef.current) => {
    const index = stepsOrder.indexOf(step)
    if (index === -1) return false
    if (index === 0) return true
    return completedSteps.includes(stepsOrder[index - 1])
  }

  const goTo = (step: StepValue) => {
    if (isUnlocked(step)) setCurrent(step)
  }

  const markComplete = (step: StepValue) => {
    setCompleted((prev) => {
      if (prev.includes(step)) return prev
      const next = [...prev, step]
      completedRef.current = next
      return next
    })
  }

  return (
    <StepsContext.Provider
      value={{ current, completed, goTo, markComplete, isUnlocked }}
    >
      <TabsPrimitive.Root
        {...props}
        value={current}
        onValueChange={(v) => goTo(v)}
        className={cn("group/tabs flex flex-col gap-2", className)}
      />
    </StepsContext.Provider>
  )
}

// -----------------------------
// UI
// -----------------------------

const stepsListVariants = cva(
  "inline-flex w-fit items-center justify-center rounded-full p-1 text-muted-foreground",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export function StepsList({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof stepsListVariants>) {
  return (
    <TabsPrimitive.List
      className={cn(stepsListVariants({ variant }), className)}
      {...props}
    />
  )
}

export function Step({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-4 outline-none", className)}
      {...props}
    />
  )
}

// -----------------------------
// Controlled Trigger
// -----------------------------

export function StepIndex({
  value,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const ctx = React.useContext(StepsContext)

  const disabled = ctx ? !ctx.isUnlocked(value as StepValue) : false

  return (
    <TabsPrimitive.Trigger
      value={value}
      disabled={disabled}
      className={cn(
        "px-3 py-1 text-sm rounded-full",
        "data-[state=active]:bg-background data-[state=active]:text-foreground",
        "disabled:opacity-50"
      )}
      {...props}
    />
  )
}