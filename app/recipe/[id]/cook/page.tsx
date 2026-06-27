"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Recipe, Paso } from '@/types/recipe';
import { 
  ArrowLeft, Mic, MicOff, Volume2, VolumeX, Play, Pause, RotateCcw, 
  Check, ChevronRight, ChevronLeft, AlertCircle, ChefHat
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { fetchRecipeById, getDeviceProfile, syncDeviceProfile } from '@/services/recipe-service';
import { useVoiceCook } from '@/components/voice/use-voice-cook';
import { ChefQueryModal } from '@/components/chef/chef-query-modal';

export default function CookFocusPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Timer states
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio settings
  const [isMuted, setIsMuted] = useState(false);
  
  // Voice status text
  const [voiceLog, setVoiceLog] = useState<string>("");
  const [showRipple, setShowRipple] = useState(false);
  const [showFinishedSplash, setShowFinishedSplash] = useState(false);
  const [chefModalOpen, setChefModalOpen] = useState(false);

  const triggerTimerDoneSound = React.useCallback(() => {
    setTimeout(() => {
      setVoiceLog("⏱️ Temporizador Completo!");
    }, 0);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance("El tiempo del paso ha terminado.");
      utterance.lang = 'es-ES';
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Load recipe & restore session if it matches this recipe
  useEffect(() => {
    if (!id) return;

    let isActive = true;

    async function loadRecipeAndSession() {
      try {
        const activeRecipe = await fetchRecipeById(id);
        if (!isActive) return;

        if (activeRecipe) {
          let restoredStepIndex = 0;

          try {
            const profile = await getDeviceProfile();
            if (
              profile.last_recipe_id === id &&
              typeof profile.last_step_index === 'number' &&
              profile.last_step_index >= 0 &&
              profile.last_step_index < activeRecipe.pasos.length
            ) {
              restoredStepIndex = profile.last_step_index;
            }
          } catch (error) {
            console.error("Error restoring last session step:", error);
          }

          if (!isActive) return;
          setCurrentStepIndex(restoredStepIndex);
          setRecipe(activeRecipe);
        }
      } catch (e) {
        console.error("Error loading recipe", e);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadRecipeAndSession();

    return () => {
      isActive = false;
    };
  }, [id]);

  // Save only resumable session identity and step index; timers and voice state stay local.
  useEffect(() => {
    if (!id || !recipe) return;

    void syncDeviceProfile({
      last_recipe_id: id,
      last_step_index: currentStepIndex,
    });
  }, [id, currentStepIndex, recipe]);

  // Current step helper
  const currentStep: Paso | undefined = recipe?.pasos[currentStepIndex];

  const chefRecipeContext = useMemo(() => {
    if (!recipe || !currentStep) {
      return null;
    }

    return {
      recipeName: recipe.nombre,
      recipeDescription: recipe.descripcion,
      tiempoTotal: recipe.tiempoTotal,
      ingredientsTotal: recipe.ingredientesTotales,
      allSteps: recipe.pasos.map((step) => ({
        numero: step.numero,
        texto: step.texto,
      })),
      currentStepNumber: currentStep.numero,
      currentStepText: currentStep.texto,
      currentStepIngredients: currentStep.ingredientesDelPaso,
    };
  }, [recipe, currentStep]);

  const openChefModal = React.useCallback(() => {
    setVoiceLog("Chef de Guardia activado...");
    setChefModalOpen(true);
  }, []);

  const handleNextStep = React.useCallback(() => {
    if (!recipe || chefModalOpen) return;
    
    // Tap visual feedback
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 600);

    if (currentStepIndex < recipe.pasos.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setVoiceLog("Cargando siguiente paso...");
    } else {
      void syncDeviceProfile({
        last_recipe_id: null,
        last_step_index: null,
      });
      setShowFinishedSplash(true);
    }
  }, [chefModalOpen, currentStepIndex, recipe]);

  const handlePrevStep = React.useCallback(() => {
    if (!chefModalOpen && currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      setVoiceLog("Regresando al paso anterior...");
    }
  }, [chefModalOpen, currentStepIndex]);

  const startTimer = React.useCallback(() => {
    setTimerActive(true);
  }, []);

  const pauseTimer = React.useCallback(() => {
    setTimerActive(false);
  }, []);

  const stopTimer = React.useCallback(() => {
    setTimerActive(false);
    if (currentStep) {
      setTimeLeft(currentStep.tiempoSegundos);
    }
  }, [currentStep]);

  const {
    isListening,
    isSpeaking,
    isSupported,
    permissionDenied,
    toggleListening,
    pauseListening,
    resumeListening,
    speakStep,
  } = useVoiceCook({
    onNextStep: handleNextStep,
    onPreviousStep: handlePrevStep,
    onStartTimer: startTimer,
    onPauseTimer: pauseTimer,
    onStopTimer: stopTimer,
    onChefQueryTrigger: openChefModal,
    isNavigationBlocked: chefModalOpen,
  });

  useEffect(() => {
    if (chefModalOpen) {
      pauseListening();
      return;
    }

    resumeListening();
  }, [chefModalOpen, pauseListening, resumeListening]);

  const speakIfAudible = React.useCallback((text: string) => {
    if (!isMuted) {
      speakStep(text);
    }
  }, [isMuted, speakStep]);

  const handleRepeatStep = React.useCallback(() => {
    if (currentStep) {
      speakIfAudible(currentStep.texto);
      setVoiceLog("Repitiendo instrucción...");
    }
  }, [currentStep, speakIfAudible]);

  const toggleTimer = React.useCallback(() => {
    setTimerActive((active) => !active);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const statusVoiceLog = React.useMemo(() => {
    if (permissionDenied) {
      return "Micr?fono bloqueado. Usa HTTPS/localhost y habilita permiso del sitio.";
    }

    if (!isSupported) {
      return "Navegador sin soporte de voz";
    }

    if (isSpeaking) {
      return "Asistente: Leyendo instrucción...";
    }

    if (isListening) {
      return "Asistente: Escuchando ('siguiente', 'repetir', 'pregunta' o 'chef')...";
    }

    return "Voz desactivada";
  }, [isListening, isSpeaking, isSupported, permissionDenied]);

  // Initialize and handle timer when step changes
  useEffect(() => {
    if (currentStep) {
      setTimeout(() => {
        if (currentStep.tieneTemporizador) {
          setTimeLeft(currentStep.tiempoSegundos);
          setTimerActive(false); // Reset active state on step change
        } else {
          setTimeLeft(0);
          setTimerActive(false);
        }
      }, 0);

      // Stop any existing timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Trigger Text-to-Speech if not muted
      speakIfAudible(currentStep.texto);
    }
  }, [currentStepIndex, recipe, currentStep, speakIfAudible]);

  // Timer countdown hook
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimeout(() => {
              setTimerActive(false);
              // Alert on timer complete
              triggerTimerDoneSound();
            }, 0);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, timeLeft, triggerTimerDoneSound]);

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-12 h-12 rounded-full border-t-2 border-teal-500 animate-spin" />
        <p className="text-slate-400 font-mono text-sm">Preparando cocina guiada...</p>
      </div>
    );
  }

  if (!recipe || !currentStep) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-screen gap-6 text-center max-w-md mx-auto px-6">
        <AlertCircle className="w-16 h-16 text-amber-500" />
        <h1 className="font-display text-2xl font-bold text-white">Error de Iniciación</h1>
        <p className="text-slate-400 text-sm">
          No pudimos configurar el módulo manos libres para esta receta. Regresa y vuelve a intentarlo.
        </p>
        <Link href="/" className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold">
          Regresar
        </Link>
      </div>
    );
  }

  const progressPercent = ((currentStepIndex + 1) / recipe.pasos.length) * 100;

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-slate-950 text-slate-100 overflow-hidden relative">
      
      {/* Top Header Section (Minimal & Clean) */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-slate-900/80 bg-slate-950/40 backdrop-blur-md">
        <Link 
          href={`/recipe/${recipe.id}`}
          onClick={() => {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
          }}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white font-mono uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-teal-400" />
          <span>Volver a la receta</span>
        </Link>

        {/* Recipe Title & Category */}
        <div className="text-center hidden md:block">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">{recipe.categoria}</span>
          <h2 className="font-display text-base font-bold text-slate-200">{recipe.nombre}</h2>
        </div>

        {/* Ambient controls (Mute / Voice mode toggle) */}
        <div className="flex items-center gap-3">
          {/* Text-to-speech toggle */}
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              if (!isMuted && typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
              }
            }}
            className={`p-2 rounded-xl border transition-all ${
              isMuted 
                ? 'bg-red-950/30 border-red-500/20 text-red-400' 
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? "Activar lectura" : "Mutear lectura"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Listening Indicator */}
          <button
            onClick={toggleListening}
            disabled={!isSupported || chefModalOpen}
            className={`p-2 rounded-xl border transition-all flex items-center gap-2 text-xs font-mono uppercase ${
              isListening 
                ? 'bg-teal-950/30 border-teal-500/25 text-teal-400' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {isListening ? (
              <>
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </div>
                <span>VOZ ACTIVA</span>
              </>
            ) : (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span>{isSupported ? 'VOZ DESACTIVADA' : 'VOZ NO SOPORTADA'}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Progress Track at top */}
      <div className="w-full h-1.5 bg-slate-900 relative z-20">
        <motion.div 
          className="h-full bg-gradient-to-r from-teal-500 to-emerald-400" 
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3 }}
        />
        {/* Step dots */}
        <div className="absolute inset-0 flex justify-between items-center px-6 pointer-events-none">
          {recipe.pasos.map((paso, idx) => (
            <div 
              key={idx} 
              className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                idx <= currentStepIndex 
                  ? 'bg-teal-400 border-teal-400 scale-110' 
                  : 'bg-slate-950 border-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Focus Canvas - Large UI for Cooking from Afar */}
      <div className="flex-grow flex flex-col justify-between p-6 md:p-12 max-w-4xl w-full mx-auto relative z-10">
        
        {/* Step Label */}
        <div className="text-center pt-2">
          <span className="inline-block font-mono text-xs tracking-widest text-teal-400 uppercase bg-teal-500/10 px-3.5 py-1.5 rounded-full border border-teal-500/20">
            Paso {currentStepIndex + 1} de {recipe.pasos.length}
          </span>
        </div>

        {/* Step Text Container - ONE step in giant text */}
        <div className="flex-grow flex flex-col justify-center items-center py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -15 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="text-center space-y-8"
            >
              {/* Giant Text */}
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight max-w-3xl mx-auto px-4">
                {currentStep.texto}
              </h1>

              {/* Step specific ingredient pills (Seen from afar) */}
              {currentStep.ingredientesDelPaso.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 pt-2 max-w-2xl mx-auto">
                  {currentStep.ingredientesDelPaso.map((ing, i) => (
                    <span 
                      key={i} 
                      className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-teal-300"
                    >
                      🥕 {ing}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step Timer (Only if step has a timer) */}
        {currentStep.tieneTemporizador && (
          <div className="flex flex-col items-center justify-center pb-8 space-y-4">
            <div className="flex items-center gap-6 bg-slate-900/60 border border-slate-800/80 px-6 py-4 rounded-2xl">
              <div className="text-left">
                <span className="block text-[10px] font-mono tracking-wider text-slate-400 uppercase">TIEMPO REQUERIDO</span>
                <span className="block text-3xl sm:text-4xl font-mono font-bold text-amber-400">
                  {formatTime(timeLeft)}
                </span>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTimer}
                  className={`p-3 rounded-xl transition-all ${
                    timerActive 
                      ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300' 
                      : 'bg-teal-500/20 border border-teal-500/30 text-teal-400 hover:bg-teal-500/30'
                  }`}
                  title={timerActive ? "Pausar" : "Iniciar"}
                >
                  {timerActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
                <button
                  onClick={stopTimer}
                  className="p-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all"
                  title="Reiniciar"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Voice Feedback / Sound status HUD */}
        <div className="flex flex-col items-center justify-center pb-6">
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-900 px-4 py-2.5 rounded-full shadow-lg max-w-md w-full">
            <div 
              id="voice-indicator"
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                isListening ? 'bg-teal-500/10 text-teal-400 voice-pulse-glow' : 'bg-slate-900 text-slate-500'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-mono text-slate-400 truncate select-none">
              {voiceLog || statusVoiceLog}
            </span>
          </div>
        </div>

        {/* Unified Big Action Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-slate-900/60 pt-6">
          {/* Step Back (Hidden or small for afar, but useful) */}
          <button
            onClick={handlePrevStep}
            disabled={chefModalOpen || currentStepIndex === 0}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-sm font-semibold text-slate-300 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Paso Anterior</span>
          </button>

          <button
            onClick={openChefModal}
            disabled={chefModalOpen}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-teal-950/40 hover:bg-teal-900/50 border border-teal-500/25 hover:border-teal-400/40 text-sm font-semibold text-teal-300 hover:text-teal-200 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2"
            title="También puedes decir 'pregunta' o 'chef' con la voz activa"
          >
            <ChefHat className="w-4 h-4" />
            <span>Preguntar al chef</span>
          </button>

          {/* MASSIVE SINGLE ACTION BUTTON - OPTIMIZED FOR TAP OR VOICE FEEDBACK */}
          <div className="relative w-full max-w-md">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleNextStep}
              disabled={chefModalOpen}
              className="w-full relative flex items-center justify-center gap-3 py-5 px-8 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 text-white font-bold text-lg shadow-2xl shadow-teal-500/20 hover:from-teal-400 hover:to-emerald-400 transition-all duration-300 cursor-pointer overflow-hidden group"
            >
              {/* Inner glowing hover effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-teal-400 to-emerald-400 opacity-0 group-hover:opacity-20 blur-md transition-opacity" />

              <span>{currentStepIndex === recipe.pasos.length - 1 ? '¡Terminar Receta!' : 'Paso Siguiente'}</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />

              {/* Concentric visual ripple rings when clicked */}
              {showRipple && (
                <motion.span
                  initial={{ scale: 0, opacity: 0.7 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-2xl bg-white pointer-events-none"
                />
              )}
            </motion.button>
          </div>

          {/* Muted instruction manual play button */}
          <button
            onClick={handleRepeatStep}
            disabled={chefModalOpen}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-sm font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-amber-500" />
            <span>Repetir Audio</span>
          </button>
        </div>
      </div>

      {chefRecipeContext && (
        <ChefQueryModal
          isOpen={chefModalOpen}
          onClose={() => setChefModalOpen(false)}
          recipeContext={chefRecipeContext}
          isMuted={isMuted}
        />
      )}

      {/* Celebration Finished Splash Overlay Modal */}
      <AnimatePresence>
        {showFinishedSplash && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-md rounded-2xl glass-panel glow-amber-border p-8 text-center space-y-6 shadow-2xl"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 glow-amber mb-2">
                <Check className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="font-display text-3xl font-bold text-white">¡Buen Provecho!</h2>
                <p className="text-slate-300 text-sm">
                  Has completado exitosamente la receta de <span className="text-teal-400 font-semibold">{recipe.nombre}</span> usando tu asistente inteligente.
                </p>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 font-mono">
                🍰 ¡Felicidades cocinero! Todos los pasos de cocción han sido completados de forma impecable.
              </div>

              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                  router.push('/');
                }}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold text-sm transition-all duration-300 shadow-lg shadow-teal-500/15"
              >
                Volver al Panel de Recetas
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
