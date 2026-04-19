import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import CivilServantSignupForms from "@/components/auth/CivilServantSignupForms"
import StudentSignupForms from "@/components/auth/StudentSignupForms"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Props = {
  paths: {
    login: string
  }
}

export function SignupForm(props: Props) {
  const paths = props.paths

  return (

    <Tabs defaultValue="civil-servant" className="w-full max-w-md">
      <TabsList>
        <TabsTrigger value="civil-servant">Servidor Público</TabsTrigger>
        <TabsTrigger value="student">Estudante</TabsTrigger>
      </TabsList>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>
            Para criar uma conta, utilize seu email institucional. 
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TabsContent value="civil-servant">
            <CivilServantSignupForms paths={paths} />
          </TabsContent>
          <TabsContent value="student">
            <StudentSignupForms paths={paths} />
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  )
}
