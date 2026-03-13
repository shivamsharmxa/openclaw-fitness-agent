'use client';
import { cn, formatRelativeDate } from '../../lib/utils';
import { Bot } from 'lucide-react';

export function MessageBubble({ message, isStreaming = false }) {
  const isUser = message.role === 'user';
  const isEmpty = !message.content && !isUser;
  const showCursor = isStreaming && !isUser && message.content;

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold',
          isUser ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-600'
        )}
      >
        {isUser ? 'U' : <Bot className="h-4 w-4" />}
      </div>

      {/* Bubble */}
      <div className={cn('max-w-[75%] space-y-1', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'rounded-tr-sm bg-brand-600 text-white'
              : 'rounded-tl-sm bg-gray-100 text-gray-900'
          )}
        >
          {/* Thinking state — empty bubble with pulsing dots */}
          {isEmpty ? (
            <ThinkingDots />
          ) : (
            <>
              <MessageContent content={message.content} />
              {/* Blinking cursor while streaming */}
              {showCursor && (
                <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-gray-500" />
              )}
            </>
          )}
        </div>
        {message.createdAt && !isEmpty && (
          <p className="text-xs text-gray-400">
            {formatRelativeDate(message.createdAt)}
          </p>
        )}
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-gray-400"
          style={{
            animation: 'thinking 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes thinking {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function MessageContent({ content }) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;

        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i}>
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={j}>{part.slice(2, -2)}</strong>
              ) : (
                part
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

// Kept for backward compat but no longer used in chat/page.jsx
export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600">
        <Bot className="h-4 w-4" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3">
        <ThinkingDots />
      </div>
    </div>
  );
}
