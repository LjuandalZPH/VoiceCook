"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/ui/header';
import { Recipe } from '@/types/recipe';
import { ArrowLeft, Clock, ChefHat, Play, ChevronRight, CheckCircle2, ListTodo, ClipboardList, Mic } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import FavoriteButton from '@/components/recipe/favorite-button';
import { fetchRecipeById } from '@/services/recipe-service';

export default function RecipeDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;

    let isActive = true;

    async function loadRecipe() {
      try {
        const found = await fetchRecipeById(id);
        if (isActive) {
          setRecipe(found);
        }
      } catch (e) {
        console.error("Error loading recipe", e);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadRecipe();

    return () => {
      isActive = false;
    };
  }, [id]);

  const toggleIngredient = (ingredient: string) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [ingredient]: !prev[ingredient],
    }));
  };

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-t-2 border-teal-500 animate-spin" />
        <p className="text-slate-400 font-mono text-sm">Cargando receta culinaria...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <>
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center max-w-lg mx-auto px-6 text-center py-20 gap-6">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-red-400 text-2xl">
            ⚠️
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-white">Receta no encontrada</h1>
            <p className="text-sm text-slate-400">
              No hemos podido ubicar la receta culinaria solicitada. Regresa al catálogo para ver las opciones disponibles.
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-semibold border border-slate-800 text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Catálogo</span>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10 space-y-8">
        {/* Back Link and Favorite Button */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white font-mono uppercase tracking-wider transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 text-teal-400" />
            <span>Volver al Catálogo</span>
          </Link>
          <FavoriteButton recipeId={recipe.id} />
        </div>

        {/* Recipe Title Glass Banner */}
        <section className="relative rounded-3xl overflow-hidden glass-panel border border-slate-800/80 p-6 md:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-transparent pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-bold font-mono tracking-wider px-2.5 py-1 rounded bg-teal-500/10 border border-teal-500/20 text-teal-400 uppercase">
                  {recipe.categoria}
                </span>
                <span className="text-[10px] font-bold font-mono tracking-wider px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1 uppercase">
                  <Clock className="w-3 h-3" />
                  {recipe.tiempoTotal}
                </span>
              </div>
              
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {recipe.nombre}
              </h1>
              
              <p className="text-slate-300 text-sm leading-relaxed">
                {recipe.descripcion}
              </p>
            </div>

            {/* Massive focus mode CTA */}
            <div className="flex flex-col sm:w-auto w-full">
              <Link href={`/recipe/${recipe.id}/cook`} className="w-full">
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-xl shadow-teal-500/15 cursor-pointer relative group text-center"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 opacity-25 blur-md group-hover:opacity-45 transition-opacity" />
                  
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-current animate-pulse" />
                    </div>
                    <div className="text-left">
                      <span className="block text-xs font-bold font-mono tracking-wider uppercase text-teal-100">
                        MODO MANOS LIBRES
                      </span>
                      <span className="block text-lg font-bold">
                        Comenzar a Cocinar
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>
              <span className="text-[10px] text-center text-slate-400 font-mono mt-2.5 flex items-center justify-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-teal-400" />
                Control por voz activo en paso a paso
              </span>
            </div>
          </div>
        </section>

        {/* Ingredients & Prep Columns */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Ingredients checklist */}
          <div className="lg:col-span-5 rounded-2xl glass-panel border border-slate-800/80 p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                <ListTodo className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-white">Ingredientes</h2>
                <p className="text-xs text-slate-400 font-mono uppercase">Mise en Place</p>
              </div>
            </div>

            <p className="text-slate-400 text-xs">Completa las porciones y marca los ingredientes que tienes listos sobre la mesada:</p>

            <ul className="space-y-2.5">
              {recipe.ingredientesTotales.map((ingredient, index) => {
                const isChecked = !!checkedIngredients[ingredient];
                return (
                  <motion.li
                    key={index}
                    whileHover={{ x: 2 }}
                    onClick={() => toggleIngredient(ingredient)}
                    className={`flex items-center gap-3.5 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isChecked
                        ? 'bg-teal-950/20 border-teal-500/30 text-slate-300'
                        : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700 text-slate-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                      isChecked ? 'bg-teal-500 text-white' : 'border border-slate-700'
                    }`}>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-sm select-none ${isChecked ? 'line-through text-slate-500' : ''}`}>
                      {ingredient}
                    </span>
                  </motion.li>
                );
              })}
            </ul>
          </div>

          {/* Right Column: Steps preview */}
          <div className="lg:col-span-7 rounded-2xl glass-panel border border-slate-800/80 p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-white">Guía de Pasos</h2>
                <p className="text-xs text-slate-400 font-mono uppercase">Vista Preliminar</p>
              </div>
            </div>

            <div className="relative border-l border-slate-800/80 ml-4 pl-6 space-y-8 py-2">
              {recipe.pasos.map((paso, idx) => (
                <div key={paso.numero} className="relative space-y-2">
                  {/* Floating Step Number */}
                  <div className="absolute -left-[37px] top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-bold font-mono text-teal-400">
                    {paso.numero}
                  </div>
                  
                  <div className="space-y-1.5">
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {paso.texto}
                    </p>
                    
                    {/* Step specific ingredient pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {paso.ingredientesDelPaso.map((ing, i) => (
                        <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                          {ing}
                        </span>
                      ))}
                      {paso.tieneTemporizador && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          ⏱ {paso.tiempoSegundos / 60} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>
      </main>
    </>
  );
}
