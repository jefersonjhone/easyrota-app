import logo from "@assets/logo-light-mode.svg"
import botaoVoltar from "@assets/botao-voltar.png"
import { Button } from "@ui/button"
import { UserIcon } from "@phosphor-icons/react"
import { useRouter, useLocation } from '@tanstack/react-router';

type User = {
  name: string
  kind: 'passager' | 'admin' | 'driver'
}

type Props = {
  description: string
  user?: User | undefined
  paths: {
    passager: string
    driver: string
    admin: string
  }
}

const Header = ({ description, user, paths }: Props) => {
  const router = useRouter();
  const location = useLocation();

  const isAdmin = user?.kind === 'admin';
  const isDriverTripPage = location.pathname.startsWith('/app/driver/');

  const handleBack = () => {
    const historyIdx = window.history.state?.idx;
    const isAdminPage = location.pathname.startsWith('/app/admin');

    if (historyIdx === 0 || isAdminPage) {
      router.history.push('/app');
    } else {
      router.history.back();
    }
  };

  const blackListPaths = ['/app']

  const showBackButton = window.history.state 
    && !blackListPaths.includes(location.pathname)

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 shadow-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-5">
          {!isDriverTripPage && showBackButton && (
            <a href="#" onClick={handleBack} className="inline-flex items-center justify-center p-2">
              <img src={botaoVoltar} alt="Voltar" className="h-auto w-10 sm:h-6 sm:w-6 opacity-80 hover:opacity-100 transition-opacity duration-200 ease-in-out" />
            </a>
          )}

          <a href={paths[user?.kind || 'passager']} className="flex items-center gap-3 rounded-2xl text-foreground transition-colors hover:text-primary">
            <img src={logo} alt="EasyRota" className="h-10 w-10" />
            <div className="leading-none">
              <h1 className="font-heading text-lg font-semibold tracking-tight">
                <span className="text-primary">Easy</span>
                <span>Rota</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            </div>
          </a>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {isAdmin && (
            <Button variant="default" size="sm" className="sm:inline-flex">
              <a href="/app/admin">
                <span>Painel</span>
              </a>
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="sm:inline-flex">
            <a href="/app/perfil">
              <UserIcon />
              <span>Perfil</span>
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Header
