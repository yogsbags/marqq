import * as fal from "@fal-ai/serverless-client";
import { FileText, Loader2, Mic } from 'lucide-react';
import { useState } from 'react';

interface ScriptGeneratorProps {
  onAudioGenerated: (url: string) => void;
  onTimestampsGenerated?: (timestamps: any[], audioBase64: string) => void;
  clonedVoiceId?: string;
}

export function ScriptGenerator({ onAudioGenerated, onTimestampsGenerated, clonedVoiceId }: ScriptGeneratorProps) {
  const [topic, setTopic] = useState('');
  const [script, setScript] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi' | 'hinglish' | 'ta' | 'bn' | 'te' | 'gu' | 'kn' | 'ml' | 'mr' | 'pa'>('en');
  const [gender, setGender] = useState<'male' | 'female'>('female');

  const handleGenerateScript = async () => {
    if (!topic) return;
    setIsGeneratingScript(true);
    try {
      const res = await fetch('/api/video-gen/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, language }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Script generation failed:", res.status, errorText);
        alert(`Failed to generate script: ${res.status} ${errorText}`);
        return;
      }

      const data = await res.json();
      console.log("Script generation response:", data);

      if (data.script) {
        setScript(data.script);
      } else {
        console.error("No script in response:", data);
        alert("Script generation succeeded but no script was returned. Check console for details.");
      }
    } catch (error) {
      console.error("Script generation failed:", error);
      alert(`Failed to generate script: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!script) return;
    setIsGeneratingAudio(true);
    try {
      // 1. Generate Audio (Base64)
      const payload: any = { text: script, language, gender };
      if (clonedVoiceId) {
        payload.voiceId = clonedVoiceId;
      }

      const res = await fetch('/api/video-gen/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.audioBase64) {
        // Store timestamps if available
        if (data.timestamps && onTimestampsGenerated) {
          onTimestampsGenerated(data.timestamps, data.audioBase64);
        }

        // 2. Convert to Blob
        const byteCharacters = atob(data.audioBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/wav' });
        const file = new File([blob], "generated_audio.wav", { type: 'audio/wav' });

        // 3. Upload to Fal
        const url = await fal.storage.upload(file);
        onAudioGenerated(url);
      }
    } catch (error) {
      console.error("Audio generation failed:", error);
      alert("Failed to generate audio.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4 text-emerald-600" />
        AI Script & Audio Generator
      </h3>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-600 mb-1 block font-medium">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Meesho IPO analysis..."
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 max-w-[120px]"
          >
            <option value="en">English</option>
            <option value="hinglish">Hinglish</option>
            <option value="hi">Hindi</option>
            <option value="bn">Bengali</option>
            <option value="gu">Gujarati</option>
            <option value="kn">Kannada</option>
            <option value="ml">Malayalam</option>
            <option value="mr">Marathi</option>
            <option value="pa">Punjabi</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
          </select>

          {clonedVoiceId ? (
            <div className="bg-indigo-100 border border-indigo-300 rounded-lg px-3 py-1 text-xs text-indigo-700 flex items-center gap-2 flex-1">
              <Mic className="w-3 h-3" />
              Using Cloned Voice
            </div>
          ) : (
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="female">Female Advisor</option>
              <option value="male">Male Advisor</option>
            </select>
          )}
        </div>

        <button
          onClick={handleGenerateScript}
          disabled={isGeneratingScript || !topic}
          className="text-xs px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50 w-full justify-center"
        >
          {isGeneratingScript ? <Loader2 className="w-3 h-3 animate-spin" /> : <SparklesIcon />}
          Generate Script ({language})
        </button>

        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Generated script will appear here..."
          className="w-full h-24 bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
        />

        <button
          onClick={handleGenerateAudio}
          disabled={isGeneratingAudio || !script}
          className={`w-full py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium ${
            isGeneratingAudio || !script
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 opacity-50 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-sm cursor-pointer'
          }`}
        >
          {isGeneratingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
          Generate Audio {clonedVoiceId ? '(Cloned)' : `(${gender})`}
        </button>
      </div>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
