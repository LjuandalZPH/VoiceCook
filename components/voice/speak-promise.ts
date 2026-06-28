"use client";

interface SpeakOptions {
  lang?: string;
  rate?: number;
}

export function speakPromise(text: string, options: SpeakOptions = {}): Promise<void> {
  const textToSpeak = text.trim();

  if (!textToSpeak || typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve();
  }

  window.speechSynthesis.cancel();

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = options.lang ?? "es-ES";
    utterance.rate = options.rate ?? 1;

    const complete = () => resolve();
    utterance.onend = complete;
    utterance.onerror = complete;

    window.speechSynthesis.speak(utterance);
  });
}
