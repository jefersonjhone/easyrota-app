import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link } from "@tanstack/react-router"

type Props = {
  paths: {
    login: string
  }
}

export function RequestStepForms(props: Props) {
  const paths = props.paths

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Recuperar Acesso</CardTitle>
        <CardDescription>Insira seu email para recuperar seu acesso.</CardDescription>
        <CardAction>
          <Link to={paths.login} className="w-full">
            <Button variant="link">Cancelar</Button>
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="joao@uefs.br" required />
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button type="submit" className="w-full cursor-pointer">Receber email</Button>
      </CardFooter>
    </Card>
  )
}
