"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChefConfirmation } from "@/components/voice/parse-chef-confirmation";
import { parseChefConfirmation } from "@/components/voice/parse-chef-confirmation";
import { isChefQueryTrigger } from "@/components/voice/parse-chef-trigger";
import { getSpeechRecognition } from "@/components/voice/get-speech-recognition";

type ChefVoiceMode = "idle" | "capture" | "confirm";

interface UseChefQueryVoiceOptions {
  onQuestionCaptured: (question: string) => void;
  onConfirmation: (confirmation: Exclude<ChefConfirmation, null>) => void;
  onPermissionDenied?: () => void;
}

interface UseChefQueryVoiceReturn {
  isListening: boolean;
  isSupported: boolean;
  permissionDenied: boolean;
  transcript: string;
  startCapture: () => void;
  startConfirmListening: () => void;
  stopAll: () => void;
  resetTranscript: () => void;
}

export function useChefQueryVoice({
  onQuestionCaptured,
  onConfirmation,
  onPermissionDenied,
}: UseChefQueryVoiceOptions): UseChefQueryVoiceReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return Boolean(getSpeechRecognition());
  });
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [transcript, setTranscript] = useState("");

  const modeRef = useRef<ChefVoiceMode>("idle");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recognitionRunningRef = useRef(false);
  const transcriptRef = useRef("");
  const hasMicrophonePermissionRef = useRef(false);
  const onQuestionCapturedRef = useRef(onQuestionCaptured);
  const onConfirmationRef = useRef(onConfirmation);
  const onPermissionDeniedRef = useRef(onPermissionDenied);

  useEffect(() => {
    onQuestionCapturedRef.current = onQuestionCaptured;
    onConfirmationRef.current = onConfirmation;
    onPermissionDeniedRef.current = onPermissionDenied;
  }, [onConfirmation, onPermissionDenied, onQuestionCaptured]);

  const stopRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !recognitionRunningRef.current) {
      return;
    }

    try {
      recognition.stop();
    } catch (error) {
      console.error("[useChefQueryVoice] Failed to stop speech recognition.", error);
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
      modeRef.current = "idle";
      setIsListening(false);
      hasMicrophonePermissionRef.current = false;
      setPermissionDenied(true);
      onPermissionDeniedRef.current?.();
      return false;
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
      setIsListening(true);
    } catch (error) {
      console.error("[useChefQueryVoice] Failed to start speech recognition.", error);
      recognitionRunningRef.current = false;
      setIsListening(false);
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
    recognition.lang = "es-ES";

    recognition.onstart = () => {
      recognitionRunningRef.current = true;
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      if (!result?.isFinal) {
        return;
      }

      const spokenText = result[0]?.transcript?.trim();
      if (!spokenText) {
        return;
      }

      if (modeRef.current === "capture") {
        const nextTranscript = `${transcriptRef.current} ${spokenText}`.trim();
        transcriptRef.current = nextTranscript;
        setTranscript(nextTranscript);

        if (nextTranscript.length >= 5 && !isChefQueryTrigger(nextTranscript)) {
          modeRef.current = "idle";
          stopRecognition();
          onQuestionCapturedRef.current(nextTranscript);
        }
        return;
      }

      if (modeRef.current === "confirm") {
        const confirmation = parseChefConfirmation(spokenText);
        if (confirmation) {
          modeRef.current = "idle";
          stopRecognition();
          onConfirmationRef.current(confirmation);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted") {
        return;
      }

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        modeRef.current = "idle";
        setIsListening(false);
        hasMicrophonePermissionRef.current = false;
        setPermissionDenied(true);
        onPermissionDeniedRef.current?.();
        return;
      }

      console.error("[useChefQueryVoice] Speech recognition error.", event.error);
    };

    recognition.onend = () => {
      recognitionRunningRef.current = false;
      setIsListening(false);

      if (modeRef.current !== "idle") {
        startRecognition();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      modeRef.current = "idle";
      recognitionRef.current = null;
      recognitionRunningRef.current = false;
      recognition.abort();
    };
  }, [startRecognition, stopRecognition]);

  const startCapture = useCallback(() => {
    void (async () => {
      const hasPermission = await requestMicrophoneAccess();
      if (!hasPermission) {
        return;
      }

      transcriptRef.current = "";
      setTranscript("");
      modeRef.current = "capture";
      startRecognition();
    })();
  }, [requestMicrophoneAccess, startRecognition]);

  const startConfirmListening = useCallback(() => {
    void (async () => {
      const hasPermission = await requestMicrophoneAccess();
      if (!hasPermission) {
        return;
      }

      modeRef.current = "confirm";
      startRecognition();
    })();
  }, [requestMicrophoneAccess, startRecognition]);

  const stopAll = useCallback(() => {
    modeRef.current = "idle";
    stopRecognition();
    setIsListening(false);
  }, [stopRecognition]);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = "";
    setTranscript("");
  }, []);

  return {
    isListening,
    isSupported,
    permissionDenied,
    transcript,
    startCapture,
    startConfirmListening,
    stopAll,
    resetTranscript,
  };
}
