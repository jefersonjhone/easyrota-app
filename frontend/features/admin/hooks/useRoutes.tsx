import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CreateRouteRequest } from "@features/admin/services/RoutesRequests";

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
  const [data, setData] = useState<RoutesResponse>([]);
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
    }
  }

  useEffect(() => {
    getResponse();
  }, []);

  return {
    data,
    refetch: getResponse,
  };
}

export function useCreateRouteMutation() {
  return useMutation({
    mutationFn: CreateRouteRequest,
  });
}
