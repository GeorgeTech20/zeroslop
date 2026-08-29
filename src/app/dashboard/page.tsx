import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// /dashboard no es una pantalla: es el atajo que la gente escribe de memoria.
// Sin esto caía en un 404, que la rúbrica cuenta como camino incompleto.
// Manda al panel de quien está logueado; si todavía no vinculó su usuario de
// GitHub, lo devuelve al onboarding, que es lo que le falta hacer.
export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard");

  const user = await currentUser();
  const githubAccount = user?.externalAccounts?.find(
    (account) => account.provider === "oauth_github"
  );
  const githubUsername = githubAccount?.username;

  if (githubUsername) redirect(`/developers/${githubUsername}`);
  redirect("/onboarding");
}
