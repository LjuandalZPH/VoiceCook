"use client";

import { AuthForm } from "@/components/user/AuthForm";
import { ProfileForm } from "@/components/user/ProfileForm";
import { useUser } from "@/context/user-context";

export default function ProfilePage() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-500/20 border-t-teal-500" />
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-teal-400">
            Cargando perfil...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      {user ? <ProfileForm /> : <AuthForm />}
    </main>
  );
}