import { Loader2, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { ModelType } from './ModelSelector';
import { ReelType } from './ReelTypeSelector';

interface VideoPromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  reelType: ReelType;
  model: ModelType;
  onOptimize: (optimizedPrompt: string, recommendedModel: ModelType) => void;
}

export function VideoPromptInput({ prompt, setPrompt, reelType, model, onOptimize }: VideoPromptInputProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimize = async () => {
    if (!prompt.trim()) return;

    setIsOptimizing(true);
    try {
      // For OVI model, use special OVI prompt generator
      if (model === 'ovi') {
        const res = await fetch('/api/video-gen/generate-ovi-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script: prompt, gender: 'female', persona: 'financial advisor' }),
        });
        const data = await res.json();
        if (data.prompt) {
          setPrompt(data.prompt);
        }
      } else {
        // For other models, use standard prompt optimization
        const res = await fetch('/api/video-gen/generate-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userPrompt: prompt, reelType }),
        });
        const data = await res.json();
        if (data.optimizedPrompt) {
          onOptimize(data.optimizedPrompt, data.recommendedModel);
        }
      }
    } catch (err) {
      console.error("Optimization failed", err);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-3 mb-8">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-foreground">Video Description</label>
        <button
          onClick={handleOptimize}
          disabled={isOptimizing || !prompt.trim()}
          className="flex items-center gap-2 rounded-full border border-orange-200/80 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100 disabled:opacity-50 dark:border-orange-900/40 dark:bg-orange-950/20 dark:text-orange-300 dark:hover:bg-orange-950/35"
        >
          {isOptimizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
          {model === 'ovi' ? 'Format for OVI' : `Magic Optimize for ${reelType.replace('_', ' ')}`}
        </button>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={model === 'ovi'
          ? "Enter your script (e.g., 'Welcome to our channel. Today we discuss investments.')..."
          : "Describe your video idea (e.g., 'Nifty 50 hitting all time high with fireworks')..."}
        className="h-32 w-full resize-none rounded-xl border border-orange-200/70 bg-white/90 p-4 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-orange-900/40 dark:bg-white/5"
      />
    </div>
  );
}
