'use client';
import { useEffect, useRef } from 'react';
import { chatApi } from '../../lib/api';
import { useChatStore } from '../../store/chatStore';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { ChatInput } from '../../components/chat/ChatInput';
import { useRequireAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { Bot, Loader2 } from 'lucide-react';

export default function ChatPage() {
  const { isAuthenticated } = useRequireAuth();
  const { messages, isStreaming, isLoadingHistory, addMessage, appendToLastMessage, setStreaming, initChat } =
    useChatStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    initChat();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (isStreaming) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    addMessage(userMsg);
    setStreaming(true);

    try {
      const res = await chatApi.sendStream(text);

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      // Add empty assistant message we'll stream into
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };
      addMessage(assistantMsg);

      const reader = res.body.getReader();
      // stream: true preserves state for multi-byte chars split across chunks
      const decoder = new TextDecoder('utf-8', { fatal: false });
      let done = false;
      let receivedAny = false;

      while (!done) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        const lines = decoder.decode(value, { stream: true }).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(data);
            if (parsed.chunk) { appendToLastMessage(parsed.chunk); receivedAny = true; }
            if (parsed.error) { appendToLastMessage(`\n\n*${parsed.error}*`); receivedAny = true; }
          } catch {}
        }
      }

      // If stream completed with no content, replace empty bubble with error
      if (!receivedAny) {
        appendToLastMessage('Sorry, I could not generate a response. Please try again.');
      }
    } catch (err) {
      toast.error('Failed to get response. Please try again.');
    } finally {
      setStreaming(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">AI Fitness Coach</h1>
              <p className="text-xs text-gray-500">Powered by Llama 3.3</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-xs text-gray-500">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4 scrollbar-hide">
        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading conversation...</p>
          </div>
        ) : null}
        {!isLoadingHistory && messages.map((msg, idx) => {
          const isLastMsg = idx === messages.length - 1;
          const isStreamingThis = isStreaming && isLastMsg && msg.role === 'assistant';
          return <MessageBubble key={msg.id} message={msg} isStreaming={isStreamingThis} />;
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </div>
    </div>
  );
}
