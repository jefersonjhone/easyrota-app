import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { SubmitEventHandler } from "react";

type Props = {
  paths: {
    createAccount: string;
    recoverPassword: string;
  };
};

export function LoginForms(props: Props) {
  const paths = props.paths;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const key = id;
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setErrors(data);
      }
    } catch (error) {
      console.error("Login Error:", error);
      setErrors({
        non_field_errors: ["Ops algo deu errado! Tente novamente."],
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-4 text-center text-green-600 bg-green-50 rounded-md">
        Logado com sucesso! Um dia voce chega na pagina...
      </div>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Entre com seu email institucional.</CardDescription>
        <CardAction>
          <Link to={paths.createAccount} className="w-full">
            <Button variant="link">Criar Conta</Button>
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Institucional</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@uefs.br"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
                <Link
                  to={paths.recoverPassword}
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  Esqueceu sua senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </CardFooter>
          {errors.detail ? ( <FieldDescription className="text-red-500">{errors.detail[0]}</FieldDescription>) : (<></>)}
        </form>
      </CardContent>
    </Card>
  );
}
