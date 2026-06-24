"use client";

import React, { useState } from 'react';
import { Sparkles, X, Loader2, ArrowRight, Lightbulb, ChefHat } from 'lucide-react';
import { inspireRecipeAction } from '@/actions/recipe-actions';
import { Recipe } from '@/types/recipe';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

interface InspireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeGenerated?: (recipe: Recipe) => void;
}

const PROMPT_SUGGESTIONS = [
  "Cena mexicana rápida con piña y cilantro",
  "Almuerzo vegetariano alto en proteína con quinoa",
  "Desayuno keto súper rápido de 10 minutos",
  "Postre saludable de avena y chocolate sin horno",
];

export default function InspireModal({ isOpen, onClose, onRecipeGenerated }: InspireModalProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [preferredTime, setPreferredTime] = useState('30 min');
  const [category, setCategory] = useState('Cena Rápida');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setGeneratedRecipe(null);

    try {
      const response = await inspireRecipeAction({
        prompt,
        preferredTime,
        category,
      });

      if (response.success && response.data) {
        setGeneratedRecipe(response.data);
        if (onRecipeGenerated) {
          onRecipeGenerated(response.data);
        }
      } else {
        setError(response.error || "No se pudo generar la receta.");
      }
    } catch (err: any) {
      setError("Error del sistema al conectar con la IA de cocina.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const handleGoToRecipe = () => {
    if (generatedRecipe) {
      // For demo, we can append to local list or redirect
      // Since it's a dynamic recipe, we'll navigate to its dynamic page
      // We can pass it in session storage or state.
      // Let's store it in sessionStorage so detail page can load it!
      sessionStorage.setItem(`recipe-${generatedRecipe.id}`, JSON.stringify(generatedRecipe));
      router.push(`/recipe/${generatedRecipe.id}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-2xl rounded-2xl glass-panel glow-teal-border overflow-hidden shadow-2xl"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white">Inspirar Nueva Receta</h2>
              <p className="text-xs text-slate-400">La IA de VoiceCook creará un menú guiado por voz a tu medida.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors duration-200 p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
            {!generatedRecipe ? (
              <motion.form
                key="input-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Text Prompt input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    ¿Qué tienes en mente o qué ingredientes quieres usar?
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    required
                    placeholder="Ej. Tacos al pastor rápidos, o cena ligera vegetariana con aguacate y tomates..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/85 border border-slate-800 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 text-slate-100 placeholder-slate-500 text-sm outline-none resize-none transition-all duration-200"
                  />
                </div>

                {/* Suggestions Pills */}
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Sugerencias rápidas:</span>
                  <div className="flex flex-wrap gap-2">
                    {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="text-xs px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all text-left"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipe Customization Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Tiempo Estimado</label>
                    <select
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-teal-500/50 text-slate-300 text-sm outline-none cursor-pointer"
                    >
                      <option value="15 min">Express (15 min)</option>
                      <option value="30 min">Estándar (30 min)</option>
                      <option value="45 min">Elaborado (45 min)</option>
                      <option value="1 hora">Gourmet (1 h+)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Categoría</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-teal-500/50 text-slate-300 text-sm outline-none cursor-pointer"
                    >
                      <option value="Almuerzos Rápidos">Almuerzos Rápidos</option>
                      <option value="Cena Rápida">Cena Rápida</option>
                      <option value="Desayuno Saludable">Desayuno Saludable</option>
                      <option value="Postres Exquisitos">Postres Exquisitos</option>
                    </select>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm leading-relaxed">
                    {error}
                  </div>
                )}

                {/* Form Action */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/50">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-teal-500/10"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Inspirando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generar Receta</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="success-container"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6 text-center py-6"
              >
                {/* Visual success splash */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 glow-teal mb-2">
                  <ChefHat className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="font-display text-2xl font-bold text-white mb-2">
                    ¡Receta Inspirada con Éxito!
                  </h3>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                    La IA ha elaborado la receta perfecta basada en tu antojo. Ya está lista para que comiences a cocinar con manos libres.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-left max-w-md mx-auto space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20 text-teal-400 font-mono font-semibold">
                      {generatedRecipe.categoria}
                    </span>
                    <span className="text-xs text-amber-400 font-mono">
                      ⏱ {generatedRecipe.tiempoTotal}
                    </span>
                  </div>
                  <h4 className="font-display text-lg font-bold text-slate-100">
                    {generatedRecipe.nombre}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {generatedRecipe.descripcion}
                  </p>
                </div>

                {/* Final Buttons */}
                <div className="flex justify-center gap-3 pt-4 border-t border-slate-800/50">
                  <button
                    onClick={() => {
                      setGeneratedRecipe(null);
                      setPrompt('');
                    }}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-all duration-200"
                  >
                    Inspirar otra
                  </button>
                  <button
                    onClick={handleGoToRecipe}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-500 hover:bg-teal-400 transition-all duration-300 shadow-lg shadow-teal-500/10"
                  >
                    <span>Ver y Cocinar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
