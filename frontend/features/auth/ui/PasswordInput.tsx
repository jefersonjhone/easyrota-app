import * as React from "react"
import { useState } from "react"
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react"

import { cn } from "@utils"
import { Input } from "@ui/input"

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
  toggleTabIndex?: number
}

export function PasswordInput({
  className,
  disabled,
  id,
  toggleTabIndex,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const label = showPassword ? "Ocultar senha" : "Mostrar senha"

  return (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        disabled={disabled}
        className={cn("pr-10", className)}
        {...props}
      />
      <button
        type="button"
        aria-controls={id}
        aria-label={label}
        aria-pressed={showPassword}
        title={label}
        tabIndex={toggleTabIndex}
        disabled={disabled}
        className="absolute right-1 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
        onClick={() => setShowPassword((value) => !value)}
      >
        {showPassword ? (
          <EyeSlashIcon aria-hidden="true" className="size-4" />
        ) : (
          <EyeIcon aria-hidden="true" className="size-4" />
        )}
      </button>
    </div>
  )
}
