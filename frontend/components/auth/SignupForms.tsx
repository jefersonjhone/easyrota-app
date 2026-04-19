import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import CivilServantSignupForms from "./CivilServantSignupForms"

export function SignupForm() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>
          Para criar uma conta, utilize seu email institucional. 
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CivilServantSignupForms />
      </CardContent>
    </Card>
  )
}
