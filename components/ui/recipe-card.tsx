"use client";

import React from 'react';
import Link from 'next/link';
import { Recipe } from '@/types/recipe';
import { Clock, ListChecks, BookOpen, ChevronRight } from 'lucide-react';
import FavoriteButton from '@/components/recipe/favorite-button';
import { motion } from 'motion/react';

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const stepCount = recipe.pasos.length;
  const ingredientCount = recipe.ingredientesTotales.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col h-full rounded-2xl glass-panel glass-panel-hover overflow-hidden"
    >
      {/* Visual Header / Colored ambient section */}
      <div className="relative h-44 w-full bg-gradient-to-br from-slate-900 to-slate-950 overflow-hidden border-b border-slate-800/60 flex items-center justify-center">
        {/* Subtle decorative mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(20,184,166,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(245,158,11,0.12),transparent_60%)]" />
        
        {/* Favorite Button */}
        <div className="absolute top-4 left-4 z-20">
          <FavoriteButton recipeId={recipe.id} />
        </div>

        {/* Abstract futuristic dish representation */}
        <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center">
          <div className="relative mb-3 flex items-center justify-center w-14 h-14 rounded-full bg-slate-900/80 border border-slate-800/80 glow-teal group-hover:border-teal-500/30 transition-colors duration-300">
            <span className="text-2xl">🍝</span>
            {/* Ambient pulse */}
            <div className="absolute inset-0 rounded-full bg-teal-500/5 animate-pulse" />
          </div>
          
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold font-mono tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 uppercase">
            {recipe.categoria}
          </span>
        </div>

        {/* Floating duration badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-mono">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{recipe.tiempoTotal}</span>
        </div>
      </div>

      {/* Recipe Info */}
      <div className="flex flex-col flex-1 p-6">
        <h3 className="font-display text-xl font-bold tracking-tight text-white mb-2 group-hover:text-teal-300 transition-colors duration-300">
          {recipe.nombre}
        </h3>
        
        <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1 line-clamp-2">
          {recipe.descripcion}
        </p>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4 border-t border-slate-800/60 pt-4 mb-6 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-teal-400" />
            <span>{ingredientCount} Ingredientes</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>{stepCount} Pasos</span>
          </div>
        </div>

        {/* Action Button */}
        <Link href={`/recipe/${recipe.id}`} className="w-full">
          <div className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-teal-500/10 border border-slate-800 hover:border-teal-500/30 text-sm font-medium text-slate-200 hover:text-white transition-all duration-300 group/btn">
            <span>Ver Receta</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover/btn:text-teal-400 group-hover/btn:translate-x-0.5 transition-all" />
          </div>
        </Link>
      </div>

      {/* Ambient hover line glow */}
      <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
}
