"use client";

import React from 'react';
import Link from 'next/link';
import { ChefHat, Mic, HelpCircle, Flame, UserRound } from 'lucide-react';
import { useUser } from '@/context/user-context';

export default function Header() {
  const { user, profile, loading } = useUser();

  const displayName = profile?.full_name || user?.email || 'Perfil';

  const getInitials = () => {
    if (loading) return '...';

    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map((part) => part.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }

    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }

    return 'VC';
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-amber-500 p-[1px] group-hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-center w-full h-full bg-slate-950 rounded-xl">
              <ChefHat className="w-5 h-5 text-teal-400 group-hover:text-amber-300 transition-colors duration-300" />
            </div>

            {/* Glowing effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-teal-500 to-amber-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
          </div>

          <div className="flex flex-col">
            <span className="font-display text-lg font-bold tracking-tight text-white group-hover:text-teal-300 transition-colors duration-300">
              VoiceCook
            </span>

            <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
              Smart Assistant
            </span>
          </div>
        </Link>

        {/* Ambient Voice Status indicator */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 bg-teal-950/40 border border-teal-500/20 px-3.5 py-1.5 rounded-full text-xs text-teal-300 font-mono glow-teal-border">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </div>

            <Mic className="w-3.5 h-3.5" />
            <span>SISTEMA DE VOZ LISTO</span>
          </div>

          <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/20 px-3.5 py-1.5 rounded-full text-xs text-amber-300 font-mono glow-amber-border">
            <Flame className="w-3.5 h-3.5" />
            <span>COCINA ACTIVA</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-4">
          <button
            className="text-slate-400 hover:text-white transition-colors duration-200"
            title="Cómo funciona"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-teal-500/50 hover:text-teal-300"
            title={user ? 'Mi perfil' : 'Iniciar sesión'}
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-teal-400 font-mono">
              {user ? getInitials() : <UserRound className="w-4 h-4" />}
            </div>

            <span className="hidden sm:inline max-w-[120px] truncate">
              {loading ? 'Cargando...' : user ? displayName : 'Entrar'}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}