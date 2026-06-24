import { getSupabaseClient } from "@/lib/supabaseClient";
import { MOCK_RECIPES } from "@/lib/mock-data";
import {
  DeviceProfile,
  DeviceProfilePatch,
  LastSession,
  Recipe,
  RecipeRow,
} from "@/types/recipe";

const DEVICE_ID_KEY = "voicecook_device_id";
const FAVORITES_KEY = "voicecook_favorites";
const LAST_SESSION_KEY = "voicecook_last_session";

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeJsonToLocalStorage(key: string, value: unknown) {
  if (!canUseBrowserStorage()) return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`VoiceCook local fallback could not persist ${key}.`, error);
  }
}

function removeLocalStorageItem(key: string) {
  if (!canUseBrowserStorage()) return;

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`VoiceCook local fallback could not remove ${key}.`, error);
  }
}

function readFavoritesFromLocalStorage(): string[] {
  if (!canUseBrowserStorage()) return [];

  const stored = safeParseJson<unknown>(localStorage.getItem(FAVORITES_KEY), []);
  return Array.isArray(stored)
    ? stored.filter((favorite): favorite is string => typeof favorite === "string")
    : [];
}

function readLastSessionFromLocalStorage(): LastSession | null {
  if (!canUseBrowserStorage()) return null;

  const stored = safeParseJson<Partial<LastSession> | null>(
    localStorage.getItem(LAST_SESSION_KEY),
    null
  );

  if (
    stored &&
    typeof stored.recipeId === "string" &&
    typeof stored.stepIndex === "number"
  ) {
    return {
      recipeId: stored.recipeId,
      stepIndex: stored.stepIndex,
      timestamp:
        typeof stored.timestamp === "number" ? stored.timestamp : Date.now(),
    };
  }

  return null;
}

function createDeviceId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    return (Number(char) ^ (random & (15 >> (Number(char) / 4)))).toString(16);
  });
}

export function getDeviceId(): string {
  if (!canUseBrowserStorage()) {
    return createDeviceId();
  }

  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;

    const deviceId = createDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
  } catch (error) {
    console.warn("VoiceCook could not read the local device id.", error);
    return createDeviceId();
  }
}

function getLocalDeviceProfile(deviceId = getDeviceId()): DeviceProfile {
  const favorites = readFavoritesFromLocalStorage();
  const lastSession = readLastSessionFromLocalStorage();

  return {
    device_id: deviceId,
    favorites,
    last_recipe_id: lastSession?.recipeId ?? null,
    last_step_index: lastSession?.stepIndex ?? null,
  };
}

function persistLocalDeviceProfile(profile: DeviceProfile) {
  writeJsonToLocalStorage(FAVORITES_KEY, profile.favorites);

  if (profile.last_recipe_id && typeof profile.last_step_index === "number") {
    writeJsonToLocalStorage(LAST_SESSION_KEY, {
      recipeId: profile.last_recipe_id,
      stepIndex: profile.last_step_index,
      timestamp: Date.now(),
    } satisfies LastSession);
  } else {
    removeLocalStorageItem(LAST_SESSION_KEY);
  }
}

function normalizeRecipe(row: RecipeRow | Recipe): Recipe {
  return {
    id: row.id,
    nombre: row.nombre,
    categoria: row.categoria,
    descripcion: row.descripcion,
    tiempoTotal: row.tiempoTotal,
    ingredientesTotales: row.ingredientesTotales,
    pasos: row.pasos,
  };
}

function getSessionRecipe(recipeId: string): Recipe | null {
  if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") {
    return null;
  }

  try {
    const stored = sessionStorage.getItem(`recipe-${recipeId}`);
    return stored ? (JSON.parse(stored) as Recipe) : null;
  } catch (error) {
    console.warn("VoiceCook could not read the session recipe fallback.", error);
    return null;
  }
}

export async function fetchRecipes(): Promise<Recipe[]> {
  const client = getSupabaseClient();

  if (!client) {
    return MOCK_RECIPES;
  }

  try {
    const { data, error } = await client
      .from("recipes")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return MOCK_RECIPES;

    return data.map(normalizeRecipe);
  } catch (error) {
    console.warn("VoiceCook is using local recipes because Supabase failed.", error);
    return MOCK_RECIPES;
  }
}

export async function fetchRecipeById(recipeId: string): Promise<Recipe | null> {
  const sessionRecipe = getSessionRecipe(recipeId);
  if (sessionRecipe) return sessionRecipe;

  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from("recipes")
        .select("*")
        .eq("id", recipeId)
        .maybeSingle();

      if (error) throw error;
      if (data) return normalizeRecipe(data);
    } catch (error) {
      console.warn("VoiceCook is using a local recipe because Supabase failed.", error);
    }
  }

  return MOCK_RECIPES.find((recipe) => recipe.id === recipeId) ?? null;
}

export async function getDeviceProfile(): Promise<DeviceProfile> {
  const deviceId = getDeviceId();
  const client = getSupabaseClient();

  if (!client) {
    return getLocalDeviceProfile(deviceId);
  }

  try {
    const { data, error } = await client
      .from("device_profiles")
      .select("*")
      .eq("device_id", deviceId)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      const profile: DeviceProfile = {
        device_id: data.device_id,
        favorites: Array.isArray(data.favorites) ? data.favorites : [],
        last_recipe_id: data.last_recipe_id,
        last_step_index: data.last_step_index,
        updated_at: data.updated_at,
      };

      persistLocalDeviceProfile(profile);
      return profile;
    }
  } catch (error) {
    console.warn("VoiceCook is using the local device profile fallback.", error);
  }

  return getLocalDeviceProfile(deviceId);
}

export async function syncDeviceProfile(
  patch: DeviceProfilePatch
): Promise<DeviceProfile> {
  const deviceId = getDeviceId();
  const localProfile = getLocalDeviceProfile(deviceId);
  const mergedProfile: DeviceProfile = {
    ...localProfile,
    ...patch,
    device_id: deviceId,
  };

  persistLocalDeviceProfile(mergedProfile);

  const client = getSupabaseClient();
  if (!client) {
    return mergedProfile;
  }

  try {
    const { data, error } = await client
      .from("device_profiles")
      .upsert(
        {
          device_id: mergedProfile.device_id,
          favorites: mergedProfile.favorites,
          last_recipe_id: mergedProfile.last_recipe_id,
          last_step_index: mergedProfile.last_step_index,
        },
        { onConflict: "device_id" }
      )
      .select()
      .single();

    if (error) throw error;

    const syncedProfile: DeviceProfile = {
      device_id: data.device_id,
      favorites: Array.isArray(data.favorites) ? data.favorites : [],
      last_recipe_id: data.last_recipe_id,
      last_step_index: data.last_step_index,
      updated_at: data.updated_at,
    };

    persistLocalDeviceProfile(syncedProfile);
    return syncedProfile;
  } catch (error) {
    console.warn("VoiceCook kept the profile local because Supabase sync failed.", error);
    return mergedProfile;
  }
}
