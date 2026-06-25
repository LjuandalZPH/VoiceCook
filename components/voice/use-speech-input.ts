"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSpeechRecognition } from "./get-speech-recognition";

interface UseSpeechInputOptions {
  onTranscript: (text: string) => void;
  lang?: string;
}

interface UseSpeechInputReturn {
  isListening: boolean;
  isSupported: boolean;
  permissionDenied: boolean;
  toggleListening: () => void;
}

export function useSpeechInput({
  onTranscript,
  lang = "es-ES",
}: UseSpeechInputOptions): UseSpeechInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return Boolean(getSpeechRecognition());
  });
  const [permissionDenied, setPermissionDenied] = useState(false);

  const onTranscriptRef = useRef(onTranscript);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const recognitionRunningRef = useRef(false);
  const hasMicrophonePermissionRef = useRef(false);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const stopRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !recognitionRunningRef.current) {
      return;
    }

    try {
      recognition.stop();
    } catch (error) {
      console.error("[useSpeechInput] Failed to stop speech recognition.", error);
    }
  }, []);

  const startRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || recognitionRunningRef.current) {
      return;
    }

    try {
      recognition.start();
      recognitionRunningRef.current = true;
    } catch (error) {
      console.error("[useSpeechInput] Failed to start speech recognition.", error);
      recognitionRunningRef.current = false;
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, []);

  const requestMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    if (hasMicrophonePermissionRef.current) {
      return true;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      hasMicrophonePermissionRef.current = true;
      setPermissionDenied(false);
      return true;
    } catch {
      isListeningRef.current = false;
      setIsListening(false);
      hasMicrophonePermissionRef.current = false;
      setPermissionDenied(true);
      return false;
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = lang;

    recognition.onstart = () => {
      recognitionRunningRef.current = true;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      if (!result?.isFinal) {
        return;
      }

      const transcript = result[0]?.transcript?.trim();
      if (transcript) {
        onTranscriptRef.current(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted") {
        return;
      }

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        isListeningRef.current = false;
        setIsListening(false);
        hasMicrophonePermissionRef.current = false;
        setPermissionDenied(true);
        return;
      }

      console.error("[useSpeechInput] Speech recognition error.", event.error);
    };

    recognition.onend = () => {
      recognitionRunningRef.current = false;

      if (isListeningRef.current) {
        startRecognition();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current = null;
      recognitionRunningRef.current = false;
      recognition.abort();
    };
  }, [lang, startRecognition]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      return;
    }

    if (isListeningRef.current) {
      isListeningRef.current = false;
      setIsListening(false);
      stopRecognition();
      return;
    }

    void (async () => {
      const hasPermission = await requestMicrophoneAccess();
      if (!hasPermission) {
        return;
      }

      isListeningRef.current = true;
      setIsListening(true);
      startRecognition();
    })();
  }, [requestMicrophoneAccess, startRecognition, stopRecognition]);

  return {
    isListening,
    isSupported,
    permissionDenied,
    toggleListening,
  };
}
