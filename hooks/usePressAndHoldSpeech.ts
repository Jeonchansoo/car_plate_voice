import { useCallback, useEffect, useRef, useState } from 'react';
import { voiceToFourDigits, pickBestTranscript } from '../utils/voiceToDigits';

type SpeechStatus = 'idle' | 'listening' | 'unsupported' | 'error';

function humanizeSpeechError(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return '마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해 주세요.';
    case 'no-speech':
      return '음성이 감지되지 않았습니다. 다시 한 번 또렷하게 말씀해 주세요.';
    case 'audio-capture':
      return '마이크를 찾을 수 없습니다. 마이크 연결/설정을 확인해 주세요.';
    case 'network':
      return '네트워크 문제로 음성 인식이 실패했습니다.';
    case 'aborted':
      return '음성 인식이 중단되었습니다.';
    default:
      return `음성 인식 오류가 발생했습니다. (${code})`;
  }
}

interface UsePressAndHoldSpeechOptions {
  lang?: string;
}

interface UsePressAndHoldSpeechResult {
  status: SpeechStatus;
  isListening: boolean;
  rawTranscript: string;
  digits: string | null;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  handleMouseDown: () => void;
  handleMouseUp: () => void;
  handleTouchStart: () => void;
  handleTouchEnd: () => void;
}

export function usePressAndHoldSpeech(
  options: UsePressAndHoldSpeechOptions = {},
): UsePressAndHoldSpeechResult {
  const { lang = 'ko-KR' } = options;

  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [rawTranscript, setRawTranscript] = useState('');
  const [digits, setDigits] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const statusRef = useRef<SpeechStatus>('idle');
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const Win = window as Window & {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    };
    const SpeechRecognitionCtor = Win.SpeechRecognition || Win.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setStatus('unsupported');
      return;
    }

    const recognition = new SpeechRecognitionCtor() as SpeechRecognition;
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      setStatus('listening');
      setRawTranscript('');
      setDigits(null);
      setError(null);
    };

    recognition.onerror = (event: Event & { error?: string; message?: string }) => {
      setStatus('error');
      const code =
        (event && 'error' in event && typeof event.error === 'string' && event.error) ||
        (event && 'message' in event && typeof event.message === 'string' && event.message) ||
        'unknown';
      setError(humanizeSpeechError(code));
    };

    recognition.onend = () => {
      setStatus((prev) => (prev === 'listening' ? 'idle' : prev));
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      let hasFinal = false;

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];

        if (result.isFinal) {
          hasFinal = true;
          const alternatives: string[] = [];
          for (let j = 0; j < result.length; j++) {
            if (result[j] && result[j].transcript) {
              alternatives.push(result[j].transcript.trim());
            }
          }
          transcript = pickBestTranscript(alternatives);
        } else {
          if (result[0]) {
            transcript += result[0].transcript;
          }
        }
      }

      transcript = transcript.trim();
      if (!transcript) {
        return;
      }

      setRawTranscript(transcript);

      if (hasFinal) {
        const fourDigits = voiceToFourDigits(transcript);
        if (fourDigits) {
          setDigits(fourDigits);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [lang]);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }

    try {
      recognition.start();
    } catch {
      // ignore
    }
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }

    try {
      recognition.stop();
    } catch {
      // ignore
    }
  }, []);

  const handleMouseDown = useCallback(() => {
    startListening();
  }, [startListening]);

  const handleMouseUp = useCallback(() => {
    stopListening();
  }, [stopListening]);

  const handleTouchStart = useCallback((e?: TouchEvent) => {
    if (e) {
      e.preventDefault();
    }
    startListening();
  }, [startListening]);

  const handleTouchEnd = useCallback((e?: TouchEvent) => {
    if (e) {
      e.preventDefault();
    }
    stopListening();
  }, [stopListening]);

  return {
    status,
    isListening: status === 'listening',
    rawTranscript,
    digits,
    error,
    startListening,
    stopListening,
    handleMouseDown,
    handleMouseUp,
    handleTouchStart,
    handleTouchEnd,
  };
}
