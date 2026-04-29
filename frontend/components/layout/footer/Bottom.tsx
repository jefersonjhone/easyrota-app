import SocialIcon from "./SocialIcon"

const FooterBottom = () => {
  return (
    <div className="col-span-1 flex flex-col gap-6 border-t border-border pt-6 sm:col-span-2 lg:col-span-4 lg:flex-row lg:items-center lg:justify-between lg:pt-7">
      <p className="max-w-2xl text-sm text-muted-foreground">
        © 2026 EasyRota. Todos os direitos reservados. Projeto acadêmico fictício.
      </p>

      <div className="flex gap-3">
        <SocialIcon href="#" label="Instagram">
          ig
        </SocialIcon>
        <SocialIcon href="#" label="Facebook">
          fb
        </SocialIcon>
        <SocialIcon href="#" label="GitHub">
          gh
        </SocialIcon>
      </div>
    </div>
  )
}

export default FooterBottom
