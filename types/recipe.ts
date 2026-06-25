export interface Paso {
  numero: number;
  texto: string;
  ingredientesDelPaso: string[];
  tieneTemporizador: boolean;
  tiempoSegundos: number;
}

export interface Recipe {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  tiempoTotal: string;
  ingredientesTotales: string[];
  pasos: Paso[];
}

export interface DeviceProfile {
  device_id: string;
  favorites: string[];
  last_recipe_id: string | null;
  last_step_index: number | null;
  updated_at?: string;
}

export interface DeviceProfilePatch {
  favorites?: string[];
  last_recipe_id?: string | null;
  last_step_index?: number | null;
}

export interface LastSession {
  recipeId: string;
  stepIndex: number;
  timestamp: number;
}

export interface RecipeRow extends Recipe, Record<string, unknown> {
  created_at: string;
}

export interface DeviceProfileRow extends Record<string, unknown> {
  device_id: string;
  favorites: string[];
  last_recipe_id: string | null;
  last_step_index: number | null;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  cooking_preferences: string[];
  dietary_restrictions: string[];
  created_at?: string;
  updated_at?: string;
}

export interface UserProfilePatch {
  full_name?: string;
  cooking_preferences?: string[];
  dietary_restrictions?: string[];
}

export interface UserProfileRow extends Record<string, unknown> {
  id: string;
  full_name: string;
  cooking_preferences: string[];
  dietary_restrictions: string[];
  created_at: string;
  updated_at: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      recipes: {
        Row: RecipeRow;
        Insert: Record<string, unknown> &
          Omit<RecipeRow, "created_at"> & { created_at?: string };
        Update: Record<string, unknown> & Partial<Omit<RecipeRow, "id">>;
        Relationships: [];
      };
      device_profiles: {
        Row: DeviceProfileRow;
        Insert: Record<string, unknown> & {
          device_id: string;
          favorites?: string[];
          last_recipe_id?: string | null;
          last_step_index?: number | null;
          updated_at?: string;
        };
        Update: Record<string, unknown> & {
          favorites?: string[];
          last_recipe_id?: string | null;
          last_step_index?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "device_profiles_last_recipe_id_fkey";
            columns: ["last_recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          }
        ];
      };
      user_profiles: {
        Row: UserProfileRow;
        Insert: Record<string, unknown> & {
          id: string;
          full_name?: string;
          cooking_preferences?: string[];
          dietary_restrictions?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: Record<string, unknown> & {
          full_name?: string;
          cooking_preferences?: string[];
          dietary_restrictions?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
