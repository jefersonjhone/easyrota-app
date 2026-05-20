// Assets

import {
  CreateRouteImage,
  ShowRoutesImage,
  type ImageLink,
} from "@/features/admin/config/actions/images";
import {
  CreateRouteRoute,
  ShowRoutesRoute,
} from "@/features/admin/config/actions/routes";


import type { AnyRoute } from "@tanstack/react-router";

export type Card = {
  title: string;
  description: string;
  background: ImageLink;
  route: AnyRoute;
};

export const cards: Card[] = [
  {
    title: "Criar Rota",
    description: "Crie uma nova rota",
    background: CreateRouteImage,
    route: CreateRouteRoute,
  },
  {
    title: "Mostrar Rotas",
    description: "Mostra Rotas já Criadas",
    background: ShowRoutesImage,
    route: ShowRoutesRoute,
  },
];
