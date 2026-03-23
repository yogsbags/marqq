/**
 * ChatDrawer — persistent slide-over chat panel accessible from any screen.
 *
 * Wraps ChatHome inside a Sheet (right-side drawer). The left edge is
 * draggable — width is manipulated directly on the DOM element during drag
 * (no React state updates per frame) and committed to state + localStorage
 * only on mouseup.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ChatHome } from '@/components/chat/ChatHome'

const MIN_WIDTH = 380
const MAX_WIDTH = 920
const DEFAULT_WIDTH = 480
const STORAGE_KEY = 'marqq_chat_drawer_width'

interface ChatDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onModuleSelect: (moduleId: string | null) => void
  onConversationsChange: () => void
}

export function ChatDrawer({ open, onOpenChange, onModuleSelect, onConversationsChange }: ChatDrawerProps) {
  const [width, setWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const n = parseInt(saved, 10)
        if (n >= MIN_WIDTH && n <= MAX_WIDTH) return n
      }
    } catch { /* ignore */ }
    return DEFAULT_WIDTH
  })

  const panelRef = useRef<HTMLDivElement | null>(null)
  const drag = useRef({ active: false, startX: 0, startWidth: 0 })

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!drag.current.active) return
    const delta = drag.current.startX - e.clientX
    const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, drag.current.startWidth + delta))
    // Directly mutate the DOM — zero React overhead during drag
    if (panelRef.current) panelRef.current.style.width = `${next}px`
  }, [])

  const onMouseUp = useCallback(() => {
    if (!drag.current.active) return
    drag.current.active = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    // Re-enable transitions
    if (panelRef.current) panelRef.current.style.transition = ''
    // Read final width from DOM and commit to state + storage
    const finalWidth = panelRef.current
      ? parseInt(panelRef.current.style.width, 10) || DEFAULT_WIDTH
      : DEFAULT_WIDTH
    setWidth(finalWidth)
    try { localStorage.setItem(STORAGE_KEY, String(finalWidth)) } catch { /* ignore */ }
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }, [onMouseMove])

  const onDragHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    drag.current.active = true
    drag.current.startX = e.clientX
    drag.current.startWidth = panelRef.current
      ? parseInt(panelRef.current.style.width, 10) || width
      : width
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
    // Disable transitions during drag so resize is instant
    if (panelRef.current) panelRef.current.style.transition = 'none'
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [width, onMouseMove, onMouseUp])

  // Listen for prefill events dispatched by HomeView agent buttons
  useEffect(() => {
    const handler = (e: Event) => {
      const text = (e as CustomEvent<{ text: string }>).detail?.text
      if (!text) return
      const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>('[data-chat-input]')
      if (input) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
          ?? Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
        nativeInputValueSetter?.call(input, text)
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.focus()
      }
    }
    window.addEventListener('marqq:chat:prefill', handler)
    return () => window.removeEventListener('marqq:chat:prefill', handler)
  }, [])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={panelRef}
        side="right"
        hideClose
        className="p-0 flex flex-col overflow-hidden !max-w-none"
        style={{ width: `${width}px` }}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>AI Assistant</SheetTitle>
        </SheetHeader>

        {/* Drag handle — left edge */}
        <div
          onMouseDown={onDragHandleMouseDown}
          className="absolute left-0 top-0 h-full w-2 cursor-ew-resize group z-50 flex items-center justify-center"
        >
          <div className="h-full w-full group-hover:bg-orange-400/30 transition-colors duration-150" />
          <div className="absolute flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="w-1 h-1 rounded-full bg-orange-500" />
            <div className="w-1 h-1 rounded-full bg-orange-500" />
            <div className="w-1 h-1 rounded-full bg-orange-500" />
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatHome
            onClose={() => onOpenChange(false)}
            onModuleSelect={(moduleId) => onModuleSelect(moduleId)}
            onConversationsChange={onConversationsChange}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
