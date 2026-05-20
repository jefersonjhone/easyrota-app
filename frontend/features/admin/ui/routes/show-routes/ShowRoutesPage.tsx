// Components
import { useShowRoutes } from "@/features/admin/hooks/useRoutes";
import { ShowRoutesView } from "./ShowRoutesView";

export default function ShowRoutesPage() {
  const { data, isLoading } = useShowRoutes();

  console.log(data);
  console.log(isLoading);
  if (data != null) {
    return ShowRoutesView(data);
  } else {
    return ShowRoutesView([]);
  }
}
