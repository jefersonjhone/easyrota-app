import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function CivilServantSignupForms() {
  return (
    <form>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email Institucional</FieldLabel>
          <Input id="email" type="text" placeholder="joão@uefs.br" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="full-name">Nome Completo</FieldLabel>
          <Input id="full-name" type="text" placeholder="João da Silva" required/>
        </Field>
        <Field>
          <FieldLabel htmlFor="civil-servant-id">Matrícula</FieldLabel>
          <Input id="civil-servant-id" type="text" placeholder="12345678" required/>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <Input id="password" type="password" required />
          <FieldDescription>A senha deve ter ao menos 8 caracteres.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-password">Confirmar Senha</FieldLabel>
          <Input id="confirm-password" type="password" required />
          <FieldDescription>Por favor, confirme sua senha.</FieldDescription>
        </Field>
        <FieldGroup>
          <Field>
            <Button type="submit">Criar Conta</Button>
            <FieldDescription className="px-6 text-center">
                Já tem uma conta? <a href="/login">Entrar</a>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </FieldGroup>
    </form>
  )
}