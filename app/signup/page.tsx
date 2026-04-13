import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { UserSignupForm } from "@/components/auth/user-signup-form";
import { getCinematicBackdropMovies } from "@/lib/movie-feeds";
import { getCurrentUserSession } from "@/lib/user-auth";

export default async function SignupPage() {
  const [user, backdropMovies] = await Promise.all([
    getCurrentUserSession(),
    getCinematicBackdropMovies(),
  ]);

  if (user) {
    redirect("/profile");
  }

  return (
    <AuthShell
      badge="Akun baru"
      backdropMovies={backdropMovies}
      title="Daftar"
      description="Buat akun agar tontonanmu terasa lebih personal."
    >
      <UserSignupForm />
    </AuthShell>
  );
}
