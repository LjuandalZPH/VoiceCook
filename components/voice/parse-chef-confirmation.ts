import { normalizeTranscript } from "./normalize-transcript";

export type ChefConfirmation = "send" | "cancel" | null;

export function parseChefConfirmation(transcript: string): ChefConfirmation {
  const normalized = normalizeTranscript(transcript);

  if (normalized.includes("cancelar") || normalized.includes("regresar")) {
    return "cancel";
  }

  if (normalized.includes("enviar") || normalized.includes("listo")) {
    return "send";
  }

  return null;
}
