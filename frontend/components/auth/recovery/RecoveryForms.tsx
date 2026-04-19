import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RequestStepForms } from "./RequestStepForms"

type Props = {
  paths: {
    login: string
  }
}

export function RecoveryForms(props: Props) {
  const paths = props.paths

  return (
    <Tabs defaultValue="request">
      <TabsList className="justify-start">
        <TabsTrigger value="request">1. Solicitar recuperação</TabsTrigger>
        <TabsTrigger value="confirm" disabled>2. Confirmar PIN</TabsTrigger>
        <TabsTrigger value="reset" disabled>3. Redefinir senha</TabsTrigger>
      </TabsList>
      <TabsContent value="request">
        <RequestStepForms paths={paths} />
      </TabsContent>
    </Tabs>
  )
}
