"use client";

import { FormEvent, useState } from "react";
import { useUser } from "@/context/user-context";

export function AuthForm() {
  const { login, register } = useUser();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setIsError(false);

    const result = isRegister
      ? await register(email, password, fullName)
      : await login(email, password);

    if (!result.success) {
      setIsError(true);
      setMessage(result.message || "Ocurrió un error.");
    } else {
      setIsError(false);
      setMessage(result.message || "Operación realizada correctamente.");
    }

    setLoading(false);
  };

  const toggleMode = () => {
    setMode(isRegister ? "login" : "register");
    setMessage("");
    setIsError(false);
  };

  return (
    <section className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-semibold text-white">
          {isRegister ? "Crear cuenta" : "Iniciar sesión"}
        </h1>

        <p className="mt-2 text-sm text-slate-300">
          {isRegister
            ? "Crea tu perfil para personalizar tu experiencia en VoiceCook."
            : "Ingresa a tu cuenta para continuar usando VoiceCook."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {isRegister && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Nombre
            </label>

            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Tu nombre"
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-teal-400"
            />
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Correo electrónico
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="correo@ejemplo.com"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-teal-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Contraseña
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-teal-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Procesando..."
            : isRegister
              ? "Crear cuenta"
              : "Iniciar sesión"}
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
        onClick={toggleMode}
        className="mt-6 w-full text-center text-sm text-slate-300 transition hover:text-teal-300"
      >
        {isRegister
          ? "Ya tengo una cuenta"
          : "No tengo cuenta, quiero registrarme"}
      </button>
    </section>
  );
}