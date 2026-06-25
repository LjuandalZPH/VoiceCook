"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UseVoiceCookProps, UseVoiceCookReturn, VoiceCommand } from "@/types/voice";
import { getSpeechRecognition } from "./get-speech-recognition";
import { normalizeTranscript } from "./normalize-transcript";
import { parseVoiceCommand } from "./parse-voice-command";

function isFinalSpeechResult(result: SpeechRecognitionResult): boolean {
  return result.isFinal;
}

export function useVoiceCook(callbacks: UseVoiceCookProps): UseVoiceCookReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return Boolean(getSpeechRecognition());
  });
  const [permissionDenied, setPermissionDenied] = useState(false);

  const callbacksRef = useRef(callbacks);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastSpokenTextRef = useRef("");
  const lastTranscriptRef = useRef("");
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const userStoppedRef = useRef(true);
  const recognitionRunningRef = useRef(false);
  const hasMicrophonePermissionRef = useRef(false);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  const stopRecognition = useCallback(() => {
    const recognition = recognitionRef.current;

    if (!recognition || !recognitionRunningRef.current) {
      return;
    }

    try {
      recognition.stop();
    } catch (error) {
      console.error("[useVoiceCook] Failed to stop speech recognition.", error);
    }
  }, []);

  const startRecognition = useCallback(() => {
    const recognition = recognitionRef.current;

    if (!recognition || recognitionRunningRef.current || isSpeakingRef.current) {
      return;
    }

    try {
      recognition.start();
      recognitionRunningRef.current = true;
    } catch (error) {
      console.error("[useVoiceCook] Failed to start speech recognition.", error);
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
    } catch (error) {
      console.warn("[useVoiceCook] Microphone permission is blocked.");
      userStoppedRef.current = true;
      isListeningRef.current = false;
      setIsListening(false);
      hasMicrophonePermissionRef.current = false;
      setPermissionDenied(true);
      return false;
    }
  }, []);

  const dispatchCommand = useCallback(
    (command: VoiceCommand) => {
      const currentCallbacks = callbacksRef.current;

      if (command === "next") {
        currentCallbacks.onNextStep();
        return;
      }

      if (command === "previous") {
        currentCallbacks.onPreviousStep();
        return;
      }

      if (command === "repeat") {
        const lastStepText = lastSpokenTextRef.current;
        if (lastStepText && typeof window !== "undefined" && window.speechSynthesis) {
          isSpeakingRef.current = true;
          setIsSpeaking(true);
          stopRecognition();

          window.speechSynthesis.cancel();

          const utterance = new SpeechSynthesisUtterance(lastStepText);
          utterance.lang = "es-ES";
          utterance.rate = 1;

          const handleSpeechComplete = () => {
            isSpeakingRef.current = false;
            setIsSpeaking(false);

            if (isListeningRef.current && !userStoppedRef.current) {
              startRecognition();
            }
          };

          utterance.onstart = () => {
            isSpeakingRef.current = true;
            setIsSpeaking(true);
          };
          utterance.onend = handleSpeechComplete;
          utterance.onerror = handleSpeechComplete;

          window.speechSynthesis.speak(utterance);
        }
        return;
      }

      if (command === "startTimer") {
        currentCallbacks.onStartTimer();
        return;
      }

      if (command === "pauseTimer") {
        currentCallbacks.onPauseTimer();
        return;
      }

      currentCallbacks.onStopTimer();
    },
    [startRecognition, stopRecognition]
  );

  const speakStep = useCallback(
    (text: string) => {
      const textToSpeak = text.trim();
      lastSpokenTextRef.current = textToSpeak;

      if (!textToSpeak || typeof window === "undefined" || !window.speechSynthesis) {
        return;
      }

      isSpeakingRef.current = true;
      setIsSpeaking(true);
      stopRecognition();

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = "es-ES";
      utterance.rate = 1;

      const handleSpeechComplete = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);

        if (isListeningRef.current && !userStoppedRef.current) {
          startRecognition();
        }
      };

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
      };
      utterance.onend = handleSpeechComplete;
      utterance.onerror = handleSpeechComplete;

      window.speechSynthesis.speak(utterance);
    },
    [startRecognition, stopRecognition]
  );

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      console.error("[useVoiceCook] Web Speech API not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "es-ES";

    recognition.onstart = () => {
      recognitionRunningRef.current = true;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (isSpeakingRef.current) {
        return;
      }

      const result = event.results[event.results.length - 1];
      if (!result || !isFinalSpeechResult(result)) {
        return;
      }

      const transcript = normalizeTranscript(result[0]?.transcript ?? "");
      if (!transcript || transcript === lastTranscriptRef.current) {
        return;
      }

      lastTranscriptRef.current = transcript;
      const command = parseVoiceCommand(transcript);
      if (command) {
        dispatchCommand(command);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted") {
        return;
      }

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        userStoppedRef.current = true;
        setIsListening(false);
        isListeningRef.current = false;
        hasMicrophonePermissionRef.current = false;
        setPermissionDenied(true);
        return;
      }

      console.error("[useVoiceCook] Speech recognition error.", event.error);
    };

    recognition.onend = () => {
      recognitionRunningRef.current = false;

      if (isListeningRef.current && !isSpeakingRef.current && !userStoppedRef.current) {
        startRecognition();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current = null;
      recognitionRunningRef.current = false;
      recognition.abort();

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [dispatchCommand, startRecognition]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      return;
    }

    if (isListeningRef.current) {
      userStoppedRef.current = true;
      isListeningRef.current = false;
      setIsListening(false);
      stopRecognition();
      return;
    }

    userStoppedRef.current = false;

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
    isSpeaking,
    isSupported,
    permissionDenied,
    toggleListening,
    speakStep,
  };
}
