import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { UserSignupForm } from "@/components/auth/user-signup-form";
import { getCinematicBackdropMovies } from "@/lib/movie-feeds";
import { getCurrentUserSession } from "@/lib/user-auth";

type SignupPageProps = {
  searchParams: Promise<{
    ref?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const [user, backdropMovies, params] = await Promise.all([
    getCurrentUserSession(),
    getCinematicBackdropMovies(),
    searchParams,
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
      <UserSignupForm referralCode={params.ref} />
    </AuthShell>
  );
}
