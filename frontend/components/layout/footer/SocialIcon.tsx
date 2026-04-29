type SocialIconProps = {
  href?: string
  label: string
  children: React.ReactNode
}

const SocialIcon: React.FC<SocialIconProps> = ({ href = "#", label, children }) => {
  return (
    <a
      href={href}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:border-primary hover:text-primary"
    >
      {children}
    </a>
  )
}

export default SocialIcon
