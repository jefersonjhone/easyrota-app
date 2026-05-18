import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CreateRouteRequest } from "@features/admin/services/createRouteRequest";

export type RouteValues = {
  id: number;
  origin: string;
  destiny: string;
  departure_time: string;
  arrival_time: string;
  administrator: number;
};

export type RoutesResponse = RouteValues[];

export type ShowRoutesErrors = Record<string, string[]>;

export function useShowRoutes() {
  const [data, setData] = useState<RoutesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getResponse() {
      try {
        const response = await fetch("/api/routes/", {
          method: "GET",
        });
        if (!response.ok) {
          throw new Error("Erro ao buscar rotas");
        } 
        const json: RoutesResponse = await response.json();
        setData(json);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    getResponse();
  }, []);

  return {
    data,
    isLoading,
  };
}


export function useCreateRouteMutation() {
	return useMutation({
		mutationFn: CreateRouteRequest,
	})
}
