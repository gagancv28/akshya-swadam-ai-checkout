'use client';

import { useRef, useEffect, useState, KeyboardEvent } from 'react';
import type { ChatMessage, Product } from '@/types';

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  products: Product[];
  cartCount?: number;
  cartTotal?: number;
  onViewCart?: () => void;
}

const QUICK_CHIPS = [
  "What spices do you have?",
  "Add 2 garam masala",
  "I need sambar powder and rasam",
  "One pack of haldi please",
  "Show me your bestseller",
];

export default function ChatWindow({
  messages,
  isLoading,
  onSendMessage,
  products,
  cartCount = 0,
  cartTotal = 0,
  onViewCart,
}: Props) {
  const [inputText, setInputText] = useState('');
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const textareaRef     = useRef<HTMLTextAreaElement>(null);

  // Butter-smooth animated scroll to bottom
  useEffect(() => {
    const el = chatMessagesRef.current;
    if (!el) return;

    const start = el.scrollTop;
    const target = el.scrollHeight - el.clientHeight;
    const change = target - start;
    if (Math.abs(change) < 2) return;

    const duration = 450; // ms
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic deceleration curve
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      el.scrollTop = start + change * easeProgress;
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [inputText]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <section className="chat-panel" aria-label="Chat with Meena, Akshaya Swadam assistant">
      {/* Panel header */}
      <div className="chat-panel-header">
        <div className="chat-avatar" aria-hidden="true">👩</div>
        <div className="chat-panel-header-text">
          <h2>Meena — Your Spice Guide</h2>
          <p>
            <span className="online-dot" aria-hidden="true" />
            <span className="sr-only">Status: </span>Online · Powered by Gemini AI
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatMessagesRef}
        className="chat-messages"
        data-lenis-prevent
        role="log"
        aria-live="polite"
        aria-label="Conversation"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message-row ${msg.role}`}
            aria-label={`${msg.role === 'user' ? 'You' : 'Meena'} said`}
          >
            <div className={`msg-avatar ${msg.role}`} aria-hidden="true">
              {msg.role === 'assistant' ? '👩' : '🧑'}
            </div>
            <div>
              <div className={`message-bubble ${msg.role}`}>
                {msg.content.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="message-row assistant" aria-label="Meena is typing">
            <div className="msg-avatar assistant" aria-hidden="true">👩</div>
            <div className="typing-indicator" aria-hidden="true">
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="chat-input-area">
        {/* Quick chips (Horizontal single-row scrollable) */}
        <div className="quick-chips" role="group" aria-label="Quick message suggestions">
          {QUICK_CHIPS.map(chip => (
            <button
              key={chip}
              className="quick-chip"
              onClick={() => onSendMessage(chip)}
              disabled={isLoading}
              aria-label={`Quick message: ${chip}`}
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="chat-input-row">
          <div className="chat-input-wrapper">
            <textarea
              ref={textareaRef}
              className="chat-input"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your order... (e.g. 2 garam masala, ek haldi)"
              disabled={isLoading}
              rows={1}
              id="chat-input"
              aria-label="Message input"
              aria-describedby="chat-hint"
            />
            <span id="chat-hint" className="sr-only">
              Press Enter to send, Shift+Enter for new line
            </span>
          </div>
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            aria-label="Send message"
            id="send-message-btn"
          >
            ➤
          </button>
        </div>
      </div>
    </section>
  );
}
