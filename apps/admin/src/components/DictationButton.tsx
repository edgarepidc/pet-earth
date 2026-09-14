'use client';

import { useState } from 'react';

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognition;
    SpeechRecognition?: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export function DictationButton({
  onTranscript,
  disabled = false,
}: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}) {
  const [listening, setListening] = useState(false);

  function toggle() {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) {
      window.alert('El dictado funciona en Chrome o Edge.');
      return;
    }
    if (listening) {
      setListening(false);
      return;
    }
    const recognition = new Ctor();
    recognition.lang = 'es-MX';
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) onTranscript(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  return (
    <button
      type="button"
      className="pe-btn-ghost px-2 py-1 text-xs"
      disabled={disabled}
      onClick={toggle}
    >
      {listening ? 'Escuchando…' : 'Dictar'}
    </button>
  );
}
