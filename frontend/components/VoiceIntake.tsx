'use client'
import { useRef, useState } from 'react'

interface VoiceIntakeProps {
  onExtracted: (data: any) => void
  lang: string
}

const langMap: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
}

const labels: Record<string, Record<string, string>> = {
  title: { en: 'Voice Intake', es: 'Entrada de Voz', fr: 'Saisie Vocale' },
  subtitle: {
    en: 'Speak the client details — AI will fill the form',
    es: 'Hable los detalles del cliente — IA llenará el formulario',
    fr: 'Parlez des détails du client — l\'IA remplira le formulaire',
  },
  start: { en: 'Start Recording', es: 'Iniciar Grabación', fr: 'Démarrer' },
  stop: { en: 'Stop Recording', es: 'Detener', fr: 'Arrêter' },
  extract: { en: '✨ Extract & Fill Form', es: '✨ Extraer y Llenar', fr: '✨ Extraire et Remplir' },
  extracting: { en: 'Extracting...', es: 'Extrayendo...', fr: 'Extraction...' },
  clear: { en: 'Clear', es: 'Limpiar', fr: 'Effacer' },
  placeholder: {
    en: 'Your speech will appear here... you can also edit this text',
    es: 'Su discurso aparecerá aquí... también puede editar este texto',
    fr: 'Votre discours apparaîtra ici... vous pouvez aussi modifier ce texte',
  },
  hint: {
    en: 'Example: "Client name is Maria Santos, born March 5 1985, phone 480 555 0199, family of 3, speaks Spanish, lives in Chandler AZ"',
    es: 'Ejemplo: "El nombre del cliente es Maria Santos, nacida el 5 de marzo de 1985, teléfono 480 555 0199, familia de 3"',
    fr: 'Exemple: "Le client s\'appelle Maria Santos, né le 5 mars 1985, téléphone 480 555 0199, famille de 3"',
  },
  noSupport: {
    en: 'Speech recognition not supported. Use Chrome.',
    es: 'Reconocimiento de voz no compatible. Use Chrome.',
    fr: 'Reconnaissance vocale non supportée. Utilisez Chrome.',
  },
}

const l = (key: string, lang: string) => labels[key]?.[lang] ?? labels[key]?.['en'] ?? key

export default function VoiceIntake({ onExtracted, lang }: VoiceIntakeProps) {
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef<any>(null)

  const startRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError(l('noSupport', lang))
      return
    }

    // Stop any existing session
    recognitionRef.current?.stop()

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = langMap[lang] ?? 'en-US'

    recognition.onresult = (event: any) => {
      let full = ''
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript
      }
      setTranscript(full)
    }

    recognition.onerror = (event: any) => {
      setError(`Mic error: ${event.error}`)
      setRecording(false)
    }

    recognition.onend = () => setRecording(false)

    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
    setError('')
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    setRecording(false)
  }

  const handleExtract = async () => {
    if (!transcript.trim()) return
    setExtracting(true)
    setError('')

    try {
      const res = await fetch('/api/ai/extract-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, lang }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        onExtracted(data)
        setTranscript('')
      }
    } catch {
      setError('Extraction failed. Try again.')
    }
    setExtracting(false)
  }

  const handleClear = () => {
    setTranscript('')
    setError('')
    recognitionRef.current?.stop()
    setRecording(false)
  }

  return (
    <div className="bg-slate-900 border border-dashed border-slate-600 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-medium">🎙️ {l('title', lang)}</p>
          <p className="text-slate-500 text-sm mt-0.5">{l('subtitle', lang)}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Language indicator */}
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-lg uppercase">
            {lang} · {langMap[lang] ?? 'en-US'}
          </span>
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              recording
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            {recording ? (
              <><span className="w-2 h-2 bg-white rounded-full" />{l('stop', lang)}</>
            ) : (
              <><span>🎤</span>{l('start', lang)}</>
            )}
          </button>
        </div>
      </div>

      {(transcript || recording) && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              rows={4}
              placeholder={l('placeholder', lang)}
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 resize-none text-sm"
            />
            {recording && (
              <div className="absolute top-3 right-3 flex gap-1 items-end">
                {[0, 1, 2].map(i => (
                  <div key={i}
                    className="w-1 bg-red-500 rounded-full animate-bounce"
                    style={{ height: `${12 + i * 4}px`, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExtract}
              disabled={extracting || !transcript.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {extracting ? l('extracting', lang) : l('extract', lang)}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2.5 text-slate-400 hover:text-white border border-slate-700 rounded-xl transition-colors text-sm"
            >
              {l('clear', lang)}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!transcript && !recording && (
        <p className="text-slate-600 text-xs">{l('hint', lang)}</p>
      )}
    </div>
  )
}