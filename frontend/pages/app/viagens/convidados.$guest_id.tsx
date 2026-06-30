/* eslint-disable react-refresh/only-export-components */
import { GuestPage } from "@/components/trips/guests/GuestPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/viagens/convidados/$guest_id")({
  component: GuestDetailPage,
});

function GuestDetailPage() {
  const { guest_id } = Route.useParams();

  return <GuestPage guest_id={guest_id} />;
}
