import logo from "@/assets/logo-light-mode.svg"

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <body>
      <header className="flex items-center justify-center-safe gap-4 p-2 border-b border-secondary">
        <img src={logo} alt="Logo" className="w-12 h-12" />
        <h1 className="font-heading font-black">
          <span className="text-primary">Easy</span>
          <span className="text-chart-5">Rota</span>
        </h1>
      </header>
      { children }
    </body>
  );
}

export default AppLayout;