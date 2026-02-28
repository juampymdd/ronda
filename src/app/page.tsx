import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  // If logged in, redirect to role-specific dashboard
  if (session?.user) {
    const role = (session.user as any).role;
    switch (role) {
      case "ADMIN":
        redirect("/admin/dashboard");
      case "MOZO":
        redirect("/mozo");
      case "BARMAN":
        redirect("/barra/kds");
      case "COCINERO":
        redirect("/cocina/kds");
      default:
        redirect("/login");
    }
  }

  // If not logged in, redirect to login
  redirect("/login");
}
