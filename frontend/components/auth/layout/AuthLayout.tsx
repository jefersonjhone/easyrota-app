import "./style.css"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
      <main className='background flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
        {children}
      </main>
  )
}