import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { UserProfilePatch, UserProfileRow } from "@/types/recipe";

function getClient() {
  if (!supabase) {
    throw new Error("Supabase no está configurado. Revisa las variables de entorno.");
  }

  return supabase;
}

export async function signUpUser(
  email: string,
  password: string,
  fullName: string
) {
  const client = getClient();

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signInUser(email: string, password: string) {
  const client = getClient();

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signOutUser() {
  const client = getClient();

  const { error } = await client.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const client = getClient();

  const { data, error } = await client.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

export async function getCurrentSession() {
  const client = getClient();

  const { data, error } = await client.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return data.session;
}

export async function getUserProfile(
  userId: string
): Promise<UserProfileRow | null> {
  const client = getClient();

  const { data, error } = await client
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createUserProfileIfNotExists(
  userId: string,
  fullName = ""
): Promise<UserProfileRow> {
  const client = getClient();

  const { data, error } = await client
    .from("user_profiles")
    .upsert(
      {
        id: userId,
        full_name: fullName,
        cooking_preferences: [],
        dietary_restrictions: [],
      },
      {
        onConflict: "id",
      }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateUserProfile(
  userId: string,
  patch: UserProfilePatch
): Promise<UserProfileRow> {
  const client = getClient();

  const { data, error } = await client
    .from("user_profiles")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}