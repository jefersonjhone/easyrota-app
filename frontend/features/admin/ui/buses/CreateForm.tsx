import { Button } from '@ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@ui/field'
import { Input } from '@ui/input'

export const CreateBusForm = () => {
  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Cadastrar novo veículo</CardTitle>
        <CardDescription>
          Informe placa, modelo e capacidade para registrar um ônibus na frota.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="plate">Placa</FieldLabel>
              <Input name="plate" type="text" placeholder="ABC-1234" />
            </Field>

            <Field>
              <FieldLabel htmlFor="brand">Modelo</FieldLabel>
              <Input name="brand" type="text" placeholder="Marcopolo Torino" />
            </Field>

            <Field>
              <FieldLabel htmlFor="capacity">Capacidade</FieldLabel>
              <Input name="capacity" type="number" min={1} max={120}
                placeholder="40"
              />
              <FieldDescription>
                A capacidade deve ficar entre 1 e 120 assentos.
              </FieldDescription>
            </Field>

            <Field>
              <Button type="submit" className="cursor-pointer">
                Salvar veículo
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
