"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { UserProfilePatch, UserProfileRow } from "@/types/recipe";
import {
  createUserProfileIfNotExists,
  getCurrentUser,
  getUserProfile,
  signInUser,
  signOutUser,
  signUpUser,
  updateUserProfile,
} from "@/services/user-service";

type AuthResult = {
  success: boolean;
  message?: string;
};

type UserContextType = {
  user: User | null;
  profile: UserProfileRow | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  saveProfile: (patch: UserProfilePatch) => Promise<AuthResult>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (currentUser: User) => {
    let currentProfile = await getUserProfile(currentUser.id);

    if (!currentProfile) {
      const fullName =
        typeof currentUser.user_metadata?.full_name === "string"
          ? currentUser.user_metadata.full_name
          : "";

      currentProfile = await createUserProfileIfNotExists(
        currentUser.id,
        fullName
      );
    }

    setProfile(currentProfile);
  };

  const refreshUser = async () => {
    try {
      setLoading(true);

      const currentUser = await getCurrentUser();

      setUser(currentUser);

      if (currentUser) {
        await loadUserProfile(currentUser);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error cargando usuario:", error);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<AuthResult> => {
    try {
      await signUpUser(email, password, fullName);
      await refreshUser();

      return {
        success: true,
        message:
          "Usuario registrado correctamente. Si Supabase solicita confirmación, revisa el correo.",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "No se pudo registrar el usuario.",
      };
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      await signInUser(email, password);
      await refreshUser();

      return {
        success: true,
        message: "Sesión iniciada correctamente.",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "No se pudo iniciar sesión.",
      };
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  const saveProfile = async (
    patch: UserProfilePatch
  ): Promise<AuthResult> => {
    if (!user) {
      return {
        success: false,
        message: "No hay un usuario autenticado.",
      };
    }

    try {
      const updatedProfile = await updateUserProfile(user.id, patch);
      setProfile(updatedProfile);

      return {
        success: true,
        message: "Perfil actualizado correctamente.",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el perfil.",
      };
    }
  };

  useEffect(() => {
    refreshUser();

    if (!supabase) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        logout,
        refreshUser,
        saveProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser debe usarse dentro de UserProvider");
  }

  return context;
}