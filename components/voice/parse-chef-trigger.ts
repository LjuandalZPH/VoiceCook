import { normalizeTranscript } from "./normalize-transcript";

export function isChefQueryTrigger(transcript: string): boolean {
  const normalized = normalizeTranscript(transcript);
  return normalized.includes("pregunta") || normalized.includes("chef");
}
