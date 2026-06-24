"use client";

import React from 'react';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/context/favorites-context';
import { motion } from 'motion/react';

interface FavoriteButtonProps {
  recipeId: string;
}

export default function FavoriteButton({ recipeId }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(recipeId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(recipeId);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.88 }}
      className={`relative p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center bg-slate-900/80 backdrop-blur-md focus:outline-none ${
        active 
          ? 'border-amber-500/30 bg-amber-500/5 text-amber-500 shadow-lg shadow-amber-500/10' 
          : 'border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/20'
      }`}
      aria-label={active ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <Heart 
        className={`w-5 h-5 transition-transform duration-300 ${active ? 'fill-amber-500 text-amber-500' : ''}`} 
      />
      {active && (
        <span className="absolute inset-0 rounded-xl bg-amber-500/10 animate-ping pointer-events-none opacity-40" />
      )}
    </motion.button>
  );
}
