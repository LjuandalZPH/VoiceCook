export type VoiceCommand =
  | "next"
  | "previous"
  | "repeat"
  | "startTimer"
  | "pauseTimer"
  | "stopTimer";

export interface UseVoiceCookProps {
  onNextStep: () => void;
  onPreviousStep: () => void;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onStopTimer: () => void;
}

export interface UseVoiceCookReturn {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  permissionDenied: boolean;
  toggleListening: () => void;
  speakStep: (text: string) => void;
}

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
  }

  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}
