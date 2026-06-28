"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Search, X } from "lucide-react";
import { useSpeechInput } from "@/components/voice/use-speech-input";

interface RecipeSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  resultCount: number;
  totalCount: number;
}

export function RecipeSearchBar({
  searchQuery,
  onSearchChange,
  resultCount,
  totalCount,
}: RecipeSearchBarProps) {
  const [voiceMessage, setVoiceMessage] = useState("");
  const stopListeningRef = useRef<(() => void) | null>(null);

  const {
    isListening,
    isSupported,
    permissionDenied,
    startListening,
    stopListening,
  } = useSpeechInput({
    lang: "es-CO",
    onTranscript: (text) => {
      const cleanText = text.trim();

      if (!cleanText) {
        setVoiceMessage("No se reconoció ningún texto. Intenta nuevamente.");
        return;
      }

      onSearchChange(cleanText);
      setVoiceMessage(`Búsqueda por voz: "${cleanText}"`);

      window.setTimeout(() => {
        stopListeningRef.current?.();
      }, 300);
    },
  });

  useEffect(() => {
    stopListeningRef.current = stopListening;
  }, [stopListening]);

  const handleVoiceSearch = () => {
    if (!isSupported) {
      setVoiceMessage("Tu navegador no soporta búsqueda por voz. Prueba con Google Chrome.");
      return;
    }

    if (permissionDenied) {
      setVoiceMessage("No se pudo acceder al micrófono. Revisa los permisos del navegador.");
      return;
    }

    setVoiceMessage("Escuchando... habla ahora.");
    startListening();
  };

  const handleClearSearch = () => {
    onSearchChange("");
    setVoiceMessage("");
    stopListening();
  };

  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

          <input
            type="text"
            value={searchQuery}
            onChange={(event) => {
              onSearchChange(event.target.value);
              setVoiceMessage("");
            }}
            placeholder="Buscar por receta, ingrediente o categoría..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 py-3 pl-11 pr-10 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-500/60"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 transition hover:bg-slate-800 hover:text-white"
              title="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={isListening ? stopListening : handleVoiceSearch}
          className={`flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
            isListening
              ? "border-teal-500/40 bg-teal-500/10 text-teal-300"
              : "border-slate-800 bg-slate-900 text-slate-300 hover:border-teal-500/50 hover:text-teal-300"
          }`}
        >
          <Mic className={`h-4 w-4 ${isListening ? "animate-pulse" : ""}`} />
          <span>{isListening ? "Detener" : "Buscar por voz"}</span>
        </button>
      </div>

      {voiceMessage && (
        <p className="mt-3 text-xs font-medium text-teal-300">
          {voiceMessage}
        </p>
      )}

      {permissionDenied && (
        <p className="mt-3 text-xs text-red-300">
          Permiso de micrófono denegado. Actívalo en la configuración del navegador.
        </p>
      )}

      {searchQuery && (
        <p className="mt-3 text-xs text-slate-400">
          Mostrando {resultCount} de {totalCount} recetas para{" "}
          <span className="font-semibold text-slate-200">
            &ldquo;{searchQuery}&rdquo;
          </span>
        </p>
      )}
    </div>
  );
}