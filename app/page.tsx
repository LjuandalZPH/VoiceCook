"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Header from '@/components/ui/header';
import RecipeCard from '@/components/ui/recipe-card';
import InspireModal from '@/components/ui/inspire-modal';
import { Recipe } from '@/types/recipe';
import { Sparkles, Plus, CookingPot, Flame, HelpCircle, Utensils, MessageSquareText, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFavorites } from '@/context/favorites-context';
import { fetchRecipes, getDeviceProfile, syncDeviceProfile } from '@/services/recipe-service';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { favorites } = useFavorites();

  const currentCategory = searchParams.get('category') || '';

  const [lastSession, setLastSession] = useState<{ recipeId: string; stepIndex: number; timestamp: number } | null>(null);
  const [lastSessionRecipe, setLastSessionRecipe] = useState<Recipe | null>(null);

  const getSlug = (str: string) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleCategoryClick = (categorySlug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentCategory === categorySlug) {
      params.delete('category');
    } else {
      params.set('category', categorySlug);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Sync with Supabase/local fallback and sessionStorage custom AI-generated recipes.
  useEffect(() => {
    let isActive = true;

    async function loadRecipes() {
      const baseRecipes = await fetchRecipes();
      const customRecipes: Recipe[] = [];

      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('recipe-')) {
          try {
            const stored = sessionStorage.getItem(key);
            if (stored) {
              const parsed = JSON.parse(stored) as Recipe;
              if (!baseRecipes.some(r => r.id === parsed.id)) {
                customRecipes.push(parsed);
              }
            }
          } catch (e) {
            console.error("Error parsing stored recipe", e);
          }
        }
      }

      if (isActive) {
        setRecipes([...baseRecipes, ...customRecipes]);
      }
    }

    void loadRecipes();

    return () => {
      isActive = false;
    };
  }, []);

  // Read last session from Supabase/local fallback
  useEffect(() => {
    let isActive = true;

    async function loadLastSession() {
      try {
        const profile = await getDeviceProfile();
        if (
          isActive &&
          profile.last_recipe_id &&
          typeof profile.last_step_index === 'number'
        ) {
          setLastSession({
            recipeId: profile.last_recipe_id,
            stepIndex: profile.last_step_index,
            timestamp: Date.now(),
          });
        }
      } catch (e) {
        console.error("Error reading last session:", e);
      }
    }

    void loadLastSession();

    return () => {
      isActive = false;
    };
  }, []);

  // Sync recipes with last session
  useEffect(() => {
    if (lastSession && recipes.length > 0) {
      const found = recipes.find(r => r.id === lastSession.recipeId);
      if (found) {
        setTimeout(() => {
          setLastSessionRecipe(found);
        }, 0);
      }
    }
  }, [lastSession, recipes]);

  const handleRecipeGenerated = (newRecipe: Recipe) => {
    setRecipes((prev) => {
      if (prev.some(r => r.id === newRecipe.id)) return prev;
      return [...prev, newRecipe];
    });
  };

  const dynamicCategories = Array.from(
    new Set(recipes.map((r) => r.categoria).filter(Boolean))
  );

  const filteredRecipes = recipes.filter((recipe) => {
    if (!currentCategory) return true;
    if (currentCategory === 'favorites') {
      return favorites.includes(recipe.id);
    }
    return recipe.categoria && (
      recipe.categoria.toLowerCase() === currentCategory.toLowerCase() ||
      getSlug(recipe.categoria) === currentCategory.toLowerCase()
    );
  });

  return (
    <>
      <Header />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 z-10">
        {/* Futuristic Culinary Hero Section */}
        <section className="relative mb-16 rounded-3xl overflow-hidden glass-panel border border-slate-800/80 p-8 md:p-12">
          {/* Subtle decoration lines & glows */}
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-indigo-500/0 to-amber-500/5 pointer-events-none" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-[80px]" />
          
          <div className="max-w-2xl relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs text-teal-400 font-mono">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>SENSORY INTELLIGENT COOKING v2.0</span>
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-none">
              Cocina sin límites, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-amber-300">
                manos libres.
              </span>
            </h1>
            
            <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl">
              Bienvenido a VoiceCook, tu asistente culinario inteligente. Controla tus recetas favoritas enteramente con tu voz mientras preparas tus platos sin tocar la pantalla.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-sm font-semibold text-white shadow-xl shadow-teal-500/10 hover:shadow-teal-500/20 transition-all duration-300 group hover:scale-[1.01]"
              >
                <Sparkles className="w-4 h-4 text-emerald-100 group-hover:rotate-12 transition-transform" />
                <span>Inspirar con Inteligencia Artificial</span>
              </button>
              
              <a
                href="#recipes-catalog"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-sm font-medium text-slate-300 hover:text-white transition-all duration-200"
              >
                <CookingPot className="w-4 h-4 text-teal-400" />
                <span>Explorar Catálogo</span>
              </a>
            </div>
          </div>
        </section>

        {/* Resume Session Card */}
        {lastSession && lastSessionRecipe && (
          <motion.section 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-12 overflow-hidden rounded-3xl bg-[#0a0c10]/60 backdrop-blur-xl border border-teal-500/20 shadow-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            {/* Ambient Aurora Glow Inside */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 relative">
                <Flame className="w-6 h-6 animate-pulse" />
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-teal-400 uppercase font-mono block mb-1">
                  Reanudar Última Receta
                </span>
                <h3 className="font-display text-xl md:text-2xl font-bold text-white mb-1.5 font-serif" style={{ fontFamily: 'Georgia, serif' }}>
                  {lastSessionRecipe.nombre}
                </h3>
                <p className="text-slate-300 text-xs md:text-sm">
                  Te quedaste en el <span className="text-teal-300 font-semibold">Paso {lastSession.stepIndex + 1} de {lastSessionRecipe.pasos.length}</span>: &ldquo;{lastSessionRecipe.pasos[lastSession.stepIndex]?.texto.substring(0, 75)}...&rdquo;
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10 self-end md:self-center">
              <button
                onClick={() => {
                  void syncDeviceProfile({
                    last_recipe_id: null,
                    last_step_index: null,
                  });
                  setLastSession(null);
                  setLastSessionRecipe(null);
                }}
                className="px-4 py-3 rounded-xl bg-slate-900/50 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-xs font-semibold text-slate-400 hover:text-red-400 transition-all duration-300"
                title="Descartar sesión"
              >
                Descartar
              </button>
              <button
                onClick={() => router.push(`/recipe/${lastSessionRecipe.id}/cook`)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-lg shadow-teal-500/20"
              >
                <span>[•] Continuar Cocinando</span>
              </button>
            </div>
          </motion.section>
        )}

        {/* Recipes Catalog Section */}
        <section id="recipes-catalog" className="space-y-8 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                <Utensils className="w-6 h-6 text-teal-400" />
                Tu Catálogo de Recetas
              </h2>
              <p className="text-sm text-slate-400">Selecciona un plato para visualizar sus ingredientes y lanzar el asistente de voz.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete('category');
                    router.push(`${pathname}?${params.toString()}`, { scroll: false });
                  }}
                  className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wide border transition-all duration-300 ${
                    !currentCategory
                      ? 'bg-teal-500/10 text-teal-400 border-teal-500/40 shadow-lg shadow-teal-500/5 font-bold'
                      : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  Todas ({recipes.length})
                </button>

                <button
                  onClick={() => handleCategoryClick('favorites')}
                  className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wide border transition-all duration-300 flex items-center gap-1.5 ${
                    currentCategory === 'favorites'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-500/5 font-bold'
                      : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${currentCategory === 'favorites' ? 'fill-amber-400 text-amber-400' : ''}`} />
                  <span>Favoritos ({favorites.length})</span>
                </button>

                {dynamicCategories.map((cat) => {
                  const slug = getSlug(cat);
                  const isActive = currentCategory === slug || currentCategory.toLowerCase() === cat.toLowerCase();
                  const count = recipes.filter(r => r.categoria === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategoryClick(slug)}
                      className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wide border transition-all duration-300 ${
                        isActive
                          ? 'bg-teal-500/10 text-teal-400 border-teal-500/40 shadow-lg shadow-teal-500/5 font-bold'
                          : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 border-slate-900 hover:border-slate-800'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-teal-500/10 border border-slate-800 hover:border-teal-500/30 text-xs font-semibold text-teal-400 hover:text-teal-300 font-mono uppercase tracking-wider transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                <span>Inspirar Plato</span>
              </button>
            </div>
          </div>

          {/* Recipes Grid / Empty State */}
          {filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/40 backdrop-blur-sm max-w-lg mx-auto">
              <div className="p-4 rounded-full bg-amber-500/5 border border-amber-500/10 text-amber-500 mb-4 animate-pulse">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {currentCategory === 'favorites' ? 'No hay recetas en favoritos' : 'No se encontraron recetas'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {currentCategory === 'favorites' 
                  ? 'Explora el catálogo y presiona el ícono del corazón en cualquier receta para guardarla aquí y acceder a ella rápidamente.'
                  : 'No hay recetas que coincidan con esta categoría de filtro.'}
              </p>
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete('category');
                  router.push(`${pathname}?${params.toString()}`, { scroll: false });
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 transition-all duration-200"
              >
                Ver todas las recetas
              </button>
            </div>
          )}
        </section>

        {/* Instructions Quick Info */}
        <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-800/40 pt-16">
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
              <MessageSquareText className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">1. Elige tu plato</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Selecciona cualquier receta del catálogo o usa la IA generativa para crear un plato con los ingredientes que te queden en el refrigerador.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">2. Prepara tus ingredientes</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Visualiza las porciones, tiempos totales y utensilios necesarios en la vista detallada antes de activar el Modo Cocinar.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">3. Cocina con manos libres</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              El asistente dictará un paso a la vez en texto gigante. Di &quot;Siguiente&quot;, &quot;Repetir&quot; o pulsa el enorme botón interactivo para guiar la receta.
            </p>
          </div>
        </section>
      </main>

      {/* Futuristic floating action button */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-teal-500 to-amber-500 text-white shadow-2xl hover:shadow-teal-500/30 transition-all duration-300 relative group"
          title="Inspirar receta con IA"
        >
          <Plus className="w-7 h-7 text-white" />
          {/* Pulse effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-500 to-amber-500 opacity-20 blur-md group-hover:opacity-40 transition-opacity" />
        </motion.button>
      </div>

      {/* Glassmorphic Footer */}
      <footer className="mt-20 border-t border-slate-800/50 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-slate-500 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span>© 2026 VoiceCook. Todos los derechos reservados.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-teal-400 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Términos</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Soporte</a>
          </div>
        </div>
      </footer>

      {/* AI Prompting Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <InspireModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onRecipeGenerated={handleRecipeGenerated}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#0a0c10] text-slate-400 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-teal-500/20 border-t-teal-500 animate-spin" />
          <div className="text-xs font-bold tracking-widest text-teal-400 font-mono uppercase">Cargando VoiceCook...</div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
