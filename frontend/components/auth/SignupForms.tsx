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

export function SignupForm() {
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
            <CivilServantSignupForms />
          </TabsContent>
          <TabsContent value="student">
            <StudentSignupForms />
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  )
}
