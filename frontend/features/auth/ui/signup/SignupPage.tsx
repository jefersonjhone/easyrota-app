import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AuthLayout from '@/features/auth/ui/AuthLayout'
import SignupForm from '@/features/auth/ui/signup/SignupForm'

export function SignupPage() {
  return (
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
              <SignupForm variant="civil-servant" paths={{ login: "/login" }} />
            </TabsContent>
            <TabsContent value="student">
              <SignupForm variant="student" paths={{ login: "/login" }} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </AuthLayout>
  )
}
