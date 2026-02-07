import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

interface FloatingChatProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const FloatingChat: React.FC<FloatingChatProps> = ({ isOpen, setIsOpen }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Greetings, seeker. I am Igris. What arcane transmutation mysteries haunt your mind today?' }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);

    // TODO: Add API call here
    setMessages(prev => [...prev, { role: 'bot', text: 'The oracle is listening...' }]);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end'
    }}>
      {isOpen && (
        <div style={{
          width: '384px',
          height: '450px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '24px',
          overflow: 'hidden',
          backdropFilter: 'blur(25px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(168, 85, 247, 0.2)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#4ade80',
                animation: 'pulse 2s infinite'
              }} />
              <span style={{
                fontSize: '10px',
                fontWeight: 'bold',
                letterSpacing: '0.2em',
                color: '#d8b4fe'
              }}>IGRIS</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.4)',
                cursor: 'pointer',
                fontSize: '20px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {messages.map((msg, i) => (
              <div 
                key={i} 
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  padding: '8px 16px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  backgroundColor: msg.role === 'user' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(34, 197, 94, 0.1)',
                  color: msg.role === 'user' ? '#e9d5ff' : '#86efac',
                  border: msg.role === 'user' ? '1px solid rgba(168, 85, 247, 0.2)' : '1px solid rgba(34, 197, 94, 0.2)'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask Igris..."
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: 'white',
                  outline: 'none'
                }}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim()}
                style={{
                  backgroundColor: 'rgba(168, 85, 247, 0.5)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#a78bfa',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: input.trim() ? 'pointer' : 'default',
                  opacity: input.trim() ? 1 : 0.5
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#9333ea',
          border: '2px solid #a78bfa',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 0 30px rgba(168, 85, 247, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        💬
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default FloatingChat;