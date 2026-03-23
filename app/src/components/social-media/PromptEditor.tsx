'use client'

import { useState, useEffect } from 'react'
import { Pencil, Lightbulb, ClipboardList, Save } from 'lucide-react'

interface PromptEditorProps {
  isOpen: boolean
  prompt: string
  stageNumber: number
  stageName: string
  onSave: (editedPrompt: string) => void
  onCancel: () => void
}

export default function PromptEditor({
  isOpen,
  prompt,
  stageNumber,
  stageName,
  onSave,
  onCancel
}: PromptEditorProps) {
  const [editedPrompt, setEditedPrompt] = useState(prompt)
  const [characterCount, setCharacterCount] = useState(0)

  useEffect(() => {
    setEditedPrompt(prompt)
    setCharacterCount(prompt.length)
  }, [prompt])

  const handleTextChange = (text: string) => {
    setEditedPrompt(text)
    setCharacterCount(text.length)
  }

  const handleSave = () => {
    onSave(editedPrompt)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[1.75rem] border border-orange-200/70 bg-background shadow-[0_28px_80px_-36px_rgba(15,23,42,0.45)] dark:border-orange-900/40 dark:bg-zinc-950">
        {/* Header */}
        <div className="border-b border-orange-200/70 bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(255,237,213,0.9))] px-6 py-5 text-foreground dark:border-orange-900/40 dark:bg-[linear-gradient(135deg,rgba(40,24,12,0.92),rgba(24,24,27,0.9))]">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Pencil className="h-5 w-5 mr-2" /> Edit Generation Prompt
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {stageName} - Stage {stageNumber}
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-foreground">
              AI Generation Prompt:
            </label>
            <p className="mb-3 text-xs text-muted-foreground">
              This prompt will be used by Gemini 3 Pro to generate images/videos.
              You can edit it to fine-tune the output based on your requirements.
            </p>
            <textarea
              value={editedPrompt}
              onChange={(e) => handleTextChange(e.target.value)}
              className="h-64 w-full resize-none rounded-2xl border border-orange-200/70 bg-white/90 px-4 py-3 font-mono text-sm text-foreground outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-orange-900/40 dark:bg-white/5"
              placeholder="Enter your custom prompt..."
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">
                <Lightbulb className="mr-1 inline h-3 w-3 text-orange-500" />
                Tip: Be specific about style, composition, colors, and mood
              </p>
              <p className="text-xs text-muted-foreground">
                {characterCount} characters
              </p>
            </div>
          </div>

          {/* Prompt Guidelines */}
          <div className="mb-4 rounded-2xl border border-orange-200/70 bg-orange-50/80 p-4 dark:border-orange-900/40 dark:bg-orange-950/20">
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-orange-800 dark:text-orange-200">
              <Lightbulb className="mr-2 h-4 w-4 text-orange-600 dark:text-orange-300" /> Prompt Writing Tips
            </h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-orange-700 dark:text-orange-100/85">
              <li>Start with the main subject and composition</li>
              <li>Specify style (e.g., "professional photography", "modern corporate")</li>
              <li>Include color palette and lighting requirements</li>
              <li>Add mood and atmosphere descriptors</li>
              <li>Mention technical details (resolution, format) if needed</li>
              <li>Reference brand guidelines when applicable</li>
            </ul>
          </div>

          {/* Preview of Key Parameters */}
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
              <ClipboardList className="mr-2 h-4 w-4 text-orange-500" /> Context from Previous Stages
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-border bg-background/85 p-2 dark:bg-background/40">
                <span className="font-semibold text-muted-foreground">Stage:</span>
                <span className="ml-2 text-foreground">{stageName}</span>
              </div>
              <div className="rounded-xl border border-border bg-background/85 p-2 dark:bg-background/40">
                <span className="font-semibold text-muted-foreground">Processing:</span>
                <span className="ml-2 text-foreground">Gemini 3 Pro Image Preview</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              The prompt will be enhanced with context from campaign configuration,
              target audience, and uploaded reference materials.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-orange-200/70 bg-muted/40 px-6 py-4 dark:border-orange-900/30">
          <button
            onClick={onCancel}
            className="rounded-xl border border-border bg-background px-6 py-2 font-semibold text-foreground transition-all hover:bg-accent"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => handleTextChange(prompt)}
              className="rounded-xl border border-orange-200/80 bg-orange-50 px-6 py-2 font-semibold text-orange-700 transition-all hover:bg-orange-100 dark:border-orange-900/40 dark:bg-orange-950/20 dark:text-orange-300 dark:hover:bg-orange-950/35"
            >
              Reset to Original
            </button>
            <button
              onClick={handleSave}
              className="flex items-center rounded-xl bg-orange-500 px-6 py-2 font-semibold text-white shadow-md transition-all hover:bg-orange-600 hover:shadow-lg"
            >
              <Save className="h-4 w-4 mr-2 inline" />
              Save & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
