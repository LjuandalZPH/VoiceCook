"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getDeviceProfile, syncDeviceProfile } from '@/services/recipe-service';

interface FavoritesContextType {
  favorites: string[];
  isFavorite: (recipeId: string) => boolean;
  toggleFavorite: (recipeId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    let isActive = true;

    async function loadFavorites() {
      setIsMounted(true);
      try {
        const profile = await getDeviceProfile();
        if (isActive) {
          setFavorites(profile.favorites);
        }
      } catch (error) {
        console.error("Error loading favorites:", error);
      }

    }

    void loadFavorites();

    return () => {
      isActive = false;
    };
  }, []);

  const isFavorite = useCallback((recipeId: string) => {
    return favorites.includes(recipeId);
  }, [favorites]);

  const toggleFavorite = useCallback((recipeId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(recipeId)
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId];
      
      try {
        localStorage.setItem('voicecook_favorites', JSON.stringify(next));
      } catch (e) {
        console.error("Error saving favorites to localStorage:", e);
      }

      void syncDeviceProfile({ favorites: next });
      return next;
    });
  }, []);

  return (
    <FavoritesContext.Provider value={{ favorites: isMounted ? favorites : [], isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
