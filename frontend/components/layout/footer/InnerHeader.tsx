import logo from "@/assets/logo-light-mode.svg"
import createSlots from "@/lib/useSlots"
import type { FC, ReactNode } from "react"

const { slots, useSlots } = createSlots("Description", "Callout")

type InnerHeaderProps = {
  children?: ReactNode
}

const Description: FC<InnerHeaderProps> = ({ children }) => {
  return (
    <p className="max-w-md text-sm leading-6 text-muted-foreground">
      {children}
    </p>
  )
}

const Callout: FC<InnerHeaderProps> = ({ children }) => {
  return (
    <div className="mt-5 max-w-md rounded-lg border border-border bg-background/70 px-4 py-3 text-xs leading-6 text-muted-foreground">
      {children}
    </div>
  )
}


const HeaderBase: FC<InnerHeaderProps> = ({ children }) => {
  const { slots } = useSlots(children)
  const description = slots.Description
  const callout = slots.Callout

  return (
    <header className="col-span-1 sm:col-span-2 lg:col-span-1 lg:pr-8">
      <a
        href="/"
        className="mb-4 inline-flex items-center gap-3 text-foreground transition-colors hover:text-primary"
      >
        <img src={logo} alt="EasyRota" className="h-10 w-10" />
        <span className="font-heading text-2xl font-semibold tracking-tight">
          <span className="text-primary">Easy</span>
          <span>Rota</span>
        </span>
      </a>

      <Description>
        {description}
      </Description>

      <strong className="mt-5 block text-xs font-semibold uppercase tracking-[0.35em] text-primary">
        Desde 2026
      </strong>

      <Callout>
        {callout}
      </Callout>
    </header>
  )
}

const InnerHeader = Object.assign(HeaderBase, slots) as FC<InnerHeaderProps> & {
  Description: typeof slots["Description"]
  Callout: typeof slots["Callout"]
}

export default InnerHeader
