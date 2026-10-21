import { useState, useEffect, useRef, useCallback } from 'react';

export type MicPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  permissionState: MicPermissionState;
  errorMessage: string | null;
  startListening: () => Promise<boolean>;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

export function useSpeechRecognition(onFinalResult?: (text: string) => void): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [permissionState, setPermissionState] = useState<MicPermissionState>('prompt');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isSupported = typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  // Initialize SpeechRecognition instance
  useEffect(() => {
    if (!isSupported) {
      setPermissionState('unsupported');
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setPermissionState('granted');
      setErrorMessage(null);
    };

    recognition.onresult = (event: any) => {
      let currentInterim = '';
      let finalSpeech = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          finalSpeech += item[0].transcript;
        } else {
          currentInterim += item[0].transcript;
        }
      }

      if (currentInterim) {
        setInterimTranscript(currentInterim);
      }

      if (finalSpeech) {
        setTranscript((prev) => {
          const next = prev ? `${prev} ${finalSpeech}` : finalSpeech;
          return next;
        });
        setInterimTranscript('');
        if (onFinalResult) {
          onFinalResult(finalSpeech.trim());
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setPermissionState('denied');
        setErrorMessage('Microphone access was denied. You can still test with simulated responses.');
      } else if (event.error === 'no-speech') {
        // No speech detected is common, keep it friendly
        setErrorMessage(null);
      } else {
        setErrorMessage(`Microphone error: ${event.error}.`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch (e) {
        // ignore
      }
    };
  }, [isSupported, onFinalResult]);

  const startListening = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !recognitionRef.current) {
      setPermissionState('unsupported');
      setErrorMessage('Speech recognition is not supported in this browser. Please use the simulated inputs.');
      return false;
    }

    try {
      setErrorMessage(null);
      setInterimTranscript('');
      recognitionRef.current.start();
      return true;
    } catch (err: any) {
      console.warn('Failed to start speech recognition:', err);
      // Sometimes it's already active
      if (err.name === 'InvalidStateError') {
        try {
          recognitionRef.current.stop();
          setTimeout(() => recognitionRef.current.start(), 200);
          return true;
        } catch (e) {
          // ignore
        }
      }
      setErrorMessage('Could not activate microphone.');
      return false;
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setErrorMessage(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    permissionState,
    errorMessage,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  };
}
