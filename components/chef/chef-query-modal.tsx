"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ChefHat, Loader2, Mic, Send, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { chefQueryAction } from "@/actions/recipe-actions";
import type { ChefQueryPhase, RecipeContextPayload } from "@/types/chef-query";
import { speakPromise } from "@/components/voice/speak-promise";
import { useChefQueryVoice } from "./use-chef-query-voice";

interface ChefQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeContext: RecipeContextPayload;
}

const VERIFY_PROMPT = "¿Es correcto? Di Enviar para procesar o Cancelar para volver.";
const ERROR_FALLBACK = "Lo siento, no pude conectarme con el chef.";

export function ChefQueryModal({
  isOpen,
  onClose,
  recipeContext,
}: ChefQueryModalProps) {
  const [phase, setPhase] = useState<ChefQueryPhase>("capture");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const closeRef = useRef(onClose);
  const mountedRef = useRef(false);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  const closeModal = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    closeRef.current();
  }, []);

  const handlePermissionDenied = useCallback(() => {
    setPhase("error");
    setError(ERROR_FALLBACK);
  }, []);

  const {
    isListening,
    isSupported,
    permissionDenied,
    transcript,
    startCapture,
    startConfirmListening,
    stopAll,
    resetTranscript,
  } = useChefQueryVoice({
    onQuestionCaptured: (capturedQuestion) => {
      setQuestion(capturedQuestion);
      setPhase("verify");
    },
    onConfirmation: (confirmation) => {
      if (confirmation === "cancel") {
        closeModal();
        return;
      }

      setPhase("loading");
    },
    onPermissionDenied: handlePermissionDenied,
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopAll();
    };
  }, [stopAll]);

  useEffect(() => {
    if (!isOpen) {
      stopAll();
      return;
    }

    setPhase("capture");
    setQuestion("");
    setAnswer("");
    setError("");
    resetTranscript();
    startCapture();
  }, [isOpen, resetTranscript, startCapture, stopAll]);

  useEffect(() => {
    if (!isOpen || phase !== "verify" || !question) {
      return;
    }

    stopAll();
    void (async () => {
      await speakPromise(VERIFY_PROMPT);
      if (!mountedRef.current || !isOpen) {
        return;
      }
      setPhase("confirm");
      startConfirmListening();
    })();
  }, [isOpen, phase, question, startConfirmListening, stopAll]);

  useEffect(() => {
    if (!isOpen || phase !== "loading" || !question) {
      return;
    }

    const controller = new AbortController();

    void (async () => {
      try {
        const response = await chefQueryAction({
          question,
          recipeContext,
        });

        if (controller.signal.aborted) {
          return;
        }

        if (!response.success || !response.data?.answer) {
          throw new Error(response.error || "Chef query failed.");
        }

        const spokenAnswer = response.data.answer.trim();
        if (!spokenAnswer) {
          throw new Error("Empty chef answer.");
        }

        setAnswer(spokenAnswer);
        setPhase("answer");
        await speakPromise(spokenAnswer);

        if (mountedRef.current && isOpen) {
          closeRef.current();
        }
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }

        setError(ERROR_FALLBACK);
        setPhase("error");
      }
    })();

    return () => {
      controller.abort();
    };
  }, [isOpen, phase, question, recipeContext]);

  useEffect(() => {
    if (!isOpen || phase !== "error" || !error) {
      return;
    }

    void (async () => {
      await speakPromise(error);
      if (mountedRef.current && isOpen) {
        closeRef.current();
      }
    })();
  }, [error, isOpen, phase]);

  if (!isOpen) {
    return null;
  }

  const visibleTranscript = question || transcript;
  const isPulsing = phase === "capture" || phase === "confirm";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/88 backdrop-blur-xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 18 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-2xl rounded-3xl glass-panel glow-teal-border overflow-hidden shadow-2xl"
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-800/80 bg-slate-900/35">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-300 border border-teal-500/20">
                {isPulsing && <span className="absolute inset-0 rounded-2xl bg-teal-400/20 animate-ping" />}
                <ChefHat className="relative w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-white">Chef de Guardia</h2>
                <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                  Consulta contextual manos libres
                </p>
              </div>
            </div>

            <button
              onClick={closeModal}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Cerrar consulta"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-7 md:p-9 min-h-[360px] flex flex-col items-center justify-center text-center space-y-7">
            {phase === "capture" && (
              <>
                <VoiceOrb active={isListening} />
                <div className="space-y-3">
                  <h3 className="font-display text-3xl md:text-4xl font-extrabold text-white">
                    Escuchando tu duda...
                  </h3>
                  <p className="text-slate-300 text-base md:text-lg">
                    Pregunta en español sobre este paso de la receta.
                  </p>
                  {!isSupported && (
                    <p className="text-amber-400 text-sm">Tu navegador no soporta reconocimiento de voz.</p>
                  )}
                  {permissionDenied && (
                    <p className="text-amber-400 text-sm">Permiso de micrófono bloqueado.</p>
                  )}
                </div>
              </>
            )}

            {(phase === "verify" || phase === "confirm") && (
              <>
                <div className="w-full rounded-3xl bg-slate-950/70 border border-slate-800 p-6">
                  <span className="block text-xs font-mono uppercase tracking-widest text-teal-400 mb-3">
                    Texto capturado
                  </span>
                  <p className="font-display text-2xl md:text-3xl font-bold text-white leading-snug">
                    {visibleTranscript}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold">
                    <Send className="w-4 h-4" />
                    <span>Di “Enviar” o “Listo” para consultar.</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <X className="w-4 h-4" />
                    <span>Di “Cancelar” o “Regresar” para volver al paso.</span>
                  </div>
                </div>
                {phase === "confirm" && <VoiceOrb active={isListening} small />}
              </>
            )}

            {phase === "loading" && (
              <>
                <div className="relative flex h-28 w-28 items-center justify-center">
                  <span className="absolute h-full w-full rounded-full border border-teal-400/40 animate-ping" />
                  <span className="absolute h-20 w-20 rounded-full border border-amber-400/40 animate-pulse" />
                  <Loader2 className="relative w-10 h-10 text-amber-300 animate-spin" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-3xl font-bold text-white">Consultando al chef...</h3>
                  <p className="text-slate-400">Analizando la receta y el paso actual.</p>
                </div>
              </>
            )}

            {phase === "answer" && (
              <>
                <ChefHat className="w-12 h-12 text-teal-300 glow-teal" />
                <div className="w-full rounded-3xl bg-teal-500/10 border border-teal-500/25 p-6">
                  <p className="font-display text-2xl md:text-3xl font-bold text-teal-100 leading-snug">
                    {answer}
                  </p>
                </div>
              </>
            )}

            {phase === "error" && (
              <>
                <AlertCircle className="w-14 h-14 text-amber-400 glow-amber" />
                <div className="space-y-2">
                  <h3 className="font-display text-3xl font-bold text-white">Chef no disponible</h3>
                  <p className="text-amber-200">{error || ERROR_FALLBACK}</p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function VoiceOrb({ active, small = false }: { active: boolean; small?: boolean }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-full border ${
        small ? "h-14 w-14" : "h-24 w-24"
      } ${
        active
          ? "bg-teal-500/15 border-teal-400/40 text-teal-300 voice-pulse-glow"
          : "bg-slate-900 border-slate-800 text-slate-500"
      }`}
    >
      {active && <span className="absolute inset-0 rounded-full bg-teal-400/20 animate-ping" />}
      <Mic className={`${small ? "w-6 h-6" : "w-10 h-10"} relative`} />
    </div>
  );
}
