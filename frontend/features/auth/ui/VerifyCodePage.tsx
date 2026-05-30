import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Button } from '@ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'

type ResendOtpResponse = {
  token?: string
} | null

export function VerifyCodePage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const params = new URLSearchParams(window.location.search)
  const mode = params.get("mode")
  const isReactivation = mode === "reactivate"
  
  // Ref para evitar execução duplicada do reenvio automático (comum no Strict Mode)
  const hasAutoResent = useRef(false)

  // Usar estado para o token para garantir re-renderização e uso do valor atualizado
  const [token, setToken] = useState(() => {
    return params.get('token')
  })

  const handleResend = useCallback(async () => {
    const params = new URLSearchParams(window.location.search)
    const email = params.get('email')

    if (!email) {
      setError('E-mail não encontrado. Por favor, tente se cadastrar novamente.')
      return
    }

    // Utiliza o endpoint correto dependendo se for OTP para reativar uma conta em 
    // processo de exclusão ou para registro.
    const url = isReactivation ? '/auth/resend-reactivation-otp/' : '/auth/resend-otp/'

    setResendLoading(true)
    setError(null)
    setResendSuccess(false)

    try {
      const data = await apiFetch<ResendOtpResponse>(url, {
        method: 'POST',
        body: JSON.stringify({ email })
      })

      if (data?.token) {
        setToken(data.token)
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set('token', data.token)
        window.history.replaceState({}, '', newUrl.toString())
      }

      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 5000)
    } catch (err: unknown) {
      console.error(err)
      setError('Erro ao reenviar o código. Verifique se o e-mail está correto.')
    } finally {
      setResendLoading(false)
    }
  }, [])

  // Efeito para reenvio automático caso chegue na página sem token (vindo da tela de erro)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const email = params.get('email')
    
    if (email && !token && !hasAutoResent.current) {
      hasAutoResent.current = true
      handleResend()
    }
  }, [handleResend, token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await apiFetch('/auth/verify-registration-otp/', {
        method: 'POST',
        body: JSON.stringify({ 
          code: code.trim(),
          token: token // Usa o token do estado (atualizado pelo reenvio)
        })
      })
      
      setSuccess(true)
      
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)

    } catch (err: unknown) {
      console.error(err)
      setError('Código inválido ou expirado. Por favor, cheque seu e-mail institucional.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border border-border">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-foreground">Verifique seu e-mail</CardTitle>
          <CardDescription>
            Insira o código de 6 dígitos que enviamos para o seu e-mail institucional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="rounded-lg bg-emerald-500/10 p-4 text-center text-sm text-emerald-500 border border-emerald-500/20 font-medium">
              Conta ativada com sucesso! Redirecionando para a tela de Login...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="verification-code" className="text-sm font-medium text-foreground">
                  Código de Confirmação
                </label>
                <input
                  id="verification-code"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-center text-2xl font-mono tracking-[0.5em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive text-center font-medium bg-destructive/10 p-2 rounded-md border border-destructive/20">
                  {error}
                </p>
              )}

              <Button 
                type="submit" 
                className="w-full bg-[#b84d05] hover:bg-[#963e04] text-white font-medium transition-colors" 
                disabled={loading || code.length !== 6}
              >
                {loading ? 'Validando...' : 'Ativar Minha Conta'}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="text-sm text-[#b84d05] hover:text-[#963e04] font-medium transition-colors disabled:opacity-50"
                >
                  {resendLoading ? 'Enviando...' : 'Reenviar código por e-mail'}
                </button>
                {resendSuccess && (
                  <p className="text-xs text-emerald-500 mt-1">Novo código enviado!</p>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
