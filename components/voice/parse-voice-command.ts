import type { VoiceCommand } from "@/types/voice";

interface VoiceCommandPhrase {
  phrase: string;
  command: VoiceCommand;
}

const COMMAND_PHRASES = [
  { phrase: "iniciar temporizador", command: "startTimer" },
  { phrase: "detener temporizador", command: "stopTimer" },
  { phrase: "pausar temporizador", command: "pauseTimer" },
  { phrase: "pausa el tiempo", command: "pauseTimer" },
  { phrase: "cancelar tiempo", command: "stopTimer" },
  { phrase: "iniciar tiempo", command: "startTimer" },
  { phrase: "pon el tiempo", command: "startTimer" },
  { phrase: "leer otra vez", command: "repeat" },
  { phrase: "siguiente", command: "next" },
  { phrase: "regresar", command: "previous" },
  { phrase: "anterior", command: "previous" },
  { phrase: "avanzar", command: "next" },
  { phrase: "detener", command: "stopTimer" },
  { phrase: "apagar", command: "stopTimer" },
  { phrase: "repetir", command: "repeat" },
  { phrase: "repite", command: "repeat" },
  { phrase: "pausar", command: "pauseTimer" },
  { phrase: "atras", command: "previous" },
].sort((a, b) => b.phrase.length - a.phrase.length) as { phrase: string; command: VoiceCommand }[];

export function parseVoiceCommand(normalizedTranscript: string): VoiceCommand | null {
  const match = COMMAND_PHRASES.find(({ phrase }) =>
    normalizedTranscript.includes(phrase)
  );

  return match?.command ?? null;
}
