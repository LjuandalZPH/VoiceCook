"use client";

import { FormEvent, useEffect, useState } from "react";
import { useUser } from "@/context/user-context";

const cookingPreferencesOptions = [
  "Recetas rápidas",
  "Recetas saludables",
  "Comida colombiana",
  "Postres",
  "Recetas económicas",
  "Comida vegetariana",
];

const dietaryRestrictionsOptions = [
  "Sin lactosa",
  "Sin gluten",
  "Sin azúcar",
  "Sin carnes rojas",
  "Vegetariano",
  "Vegano",
];

export function ProfileForm() {
  const { user, profile, saveProfile, logout } = useUser();

  const [fullName, setFullName] = useState("");
  const [cookingPreferences, setCookingPreferences] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setCookingPreferences(profile.cooking_preferences || []);
      setDietaryRestrictions(profile.dietary_restrictions || []);
    }
  }, [profile]);

  const toggleCookingPreference = (preference: string) => {
    const exists = cookingPreferences.includes(preference);

    if (exists) {
      setCookingPreferences(
        cookingPreferences.filter((item) => item !== preference)
      );
    } else {
      setCookingPreferences([...cookingPreferences, preference]);
    }
  };

  const toggleDietaryRestriction = (restriction: string) => {
    const exists = dietaryRestrictions.includes(restriction);

    if (exists) {
      setDietaryRestrictions(
        dietaryRestrictions.filter((item) => item !== restriction)
      );
    } else {
      setDietaryRestrictions([...dietaryRestrictions, restriction]);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setIsError(false);

    const result = await saveProfile({
      full_name: fullName,
      cooking_preferences: cookingPreferences,
      dietary_restrictions: dietaryRestrictions,
    });

    if (!result.success) {
      setIsError(true);
      setMessage(result.message || "No se pudo actualizar el perfil.");
    } else {
      setIsError(false);
      setMessage(result.message || "Perfil actualizado correctamente.");
    }

    setSaving(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <section className="mx-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
      <div className="mb-8">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.3em] text-teal-300">
          Perfil
        </p>

        <h1 className="font-display text-3xl font-semibold text-white">
          Mi perfil de cocina
        </h1>

        <p className="mt-2 text-sm text-slate-300">
          Personaliza tu experiencia en VoiceCook con tus preferencias y
          restricciones alimentarias.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
        <p className="text-sm text-slate-400">Sesión iniciada como:</p>
        <p className="mt-1 text-sm font-medium text-white">{user?.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Nombre
          </label>

          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Tu nombre"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-teal-400"
          />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-200">
            Preferencias de cocina
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {cookingPreferencesOptions.map((preference) => (
              <label
                key={preference}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200 transition hover:border-teal-400/60"
              >
                <input
                  type="checkbox"
                  checked={cookingPreferences.includes(preference)}
                  onChange={() => toggleCookingPreference(preference)}
                  className="h-4 w-4 accent-teal-400"
                />

                <span>{preference}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-200">
            Restricciones alimentarias
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {dietaryRestrictionsOptions.map((restriction) => (
              <label
                key={restriction}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200 transition hover:border-teal-400/60"
              >
                <input
                  type="checkbox"
                  checked={dietaryRestrictions.includes(restriction)}
                  onChange={() => toggleDietaryRestriction(restriction)}
                  className="h-4 w-4 accent-teal-400"
                />

                <span>{restriction}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar perfil"}
        </button>
      </form>

      {message && (
        <p
          className={`mt-5 rounded-2xl px-4 py-3 text-sm ${
            isError
              ? "bg-red-500/10 text-red-300"
              : "bg-teal-500/10 text-teal-300"
          }`}
        >
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={handleLogout}
        className="mt-6 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-red-400/40 hover:text-red-300"
      >
        Cerrar sesión
      </button>
    </section>
  );
}