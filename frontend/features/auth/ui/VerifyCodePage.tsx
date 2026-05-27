import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Button } from '@ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'

export function VerifyCodePage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // O backend espera o código e o token (parcial) gerado no registro
      // Como o token é retornado no registro, para simplificar nesta tela 
      // e dado que o backend exige o token para o desafio JTI, 
      // vamos tentar capturar o token que deveria ter sido passado via rota ou state.
      // Se não houver, o backend falhará na validação do JTI.
      
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')

      await apiFetch('/auth/verify-registration-otp/', {
        method: 'POST',
        body: JSON.stringify({ 
          code: code.trim(),
          token: token 
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
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}