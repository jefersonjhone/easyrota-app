import { Link } from '@tanstack/react-router'


type SocialIconProps = {
  href?: string
  label: string
  children: React.ReactNode
}

const SocialIcon: React.FC<SocialIconProps> = ({ href = "#", label, children }) => {
  return (
    <Link to={href} aria-label={label} className="
      grid h-9 w-9 place-items-center 
      bg-background transition-colors 
      rounded-full border border-border 
        hover:border-primary
      text-xs font-semibold uppercase tracking-wide text-muted-foreground 
        hover:text-primary
    ">
      {children}
    </Link>
  )
}

export default SocialIcon
