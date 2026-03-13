'use client';
import { useState, useRef } from 'react';
import { cn } from '../../lib/utils';
import { SendHorizonal } from 'lucide-react';

const QUICK_PROMPTS = [
  'Generate a workout plan for me',
  'What should I eat today?',
  'Show my progress summary',
  'How much protein do I need?',
];

export function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  const handleSend = () => {
    const msg = value.trim();
    if (!msg || disabled) return;
    onSend(msg);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setValue(e.target.value);
    // Auto-resize
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 150) + 'px';
    }
  };

  return (
    <div className="space-y-2">
      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2 px-1">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => onSend(p)}
            disabled={disabled}
            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 transition hover:border-brand-400 hover:text-brand-700 disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-end gap-2 rounded-xl border border-gray-300 bg-white p-2 shadow-sm focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask your fitness coach..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent px-2 py-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none disabled:opacity-50"
          style={{ maxHeight: '150px' }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition',
            value.trim() && !disabled
              ? 'bg-brand-600 text-white hover:bg-brand-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          <SendHorizonal className="h-4 w-4" />
        </button>
      </div>
      <p className="px-1 text-xs text-gray-400">Press Enter to send, Shift+Enter for new line</p>
    </div>
  );
}
