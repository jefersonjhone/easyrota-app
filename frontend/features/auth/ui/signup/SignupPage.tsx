// Components
import AuthLayout from '@features/auth/ui/AuthLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/card"
import SignupForm from '@features/auth/ui/signup/SignupForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/tabs"


export const SignupPage = () => (
  <AuthLayout>
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
            <SignupForm variant="civil-servant" paths={{ login: "/app/login" }} />
          </TabsContent>
          <TabsContent value="student">
            <SignupForm variant="student" paths={{ login: "/app/login" }} />
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  </AuthLayout>
)
