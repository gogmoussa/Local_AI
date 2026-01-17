import { useState, useEffect } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { api, type Message } from './services/api';
import { MessageSquarePlus, Settings, ChevronRight, Sparkles, MessageSquare, Trash2, Code, PenTool, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

const PERSONAS = [
  { id: 'default', name: 'General Assistant', icon: Sparkles, color: '#a78bfa', prompt: 'You are a helpful and versatile AI assistant.' },
  { id: 'coder', name: 'Software Engineer', icon: Code, color: '#3b82f6', prompt: 'You are an expert software engineer. Focus on clean, efficient code and best practices.' },
  { id: 'writer', name: 'Creative Writer', icon: PenTool, color: '#ec4899', prompt: 'You are a creative writer and storyteller. Use vivid language and evocative descriptions.' },
  { id: 'research', name: 'Research Analyst', icon: Globe, color: '#10b981', prompt: 'You are a detail-oriented research analyst. Provide factual, well-structured information.' }
];

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(uuidv4());
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);

  const refreshModels = async () => {
    const availableModels = await api.getModels();
    setModels(availableModels);
    
    // Set selectedModel to first available model, or keep current if still available
    if (availableModels.length > 0) {
      if (selectedModel && availableModels.includes(selectedModel)) {
        // Keep current selection if it's still available
        return;
      } else {
        // Set to first available model
        setSelectedModel(availableModels[0]);
      }
    } else {
      // No models available
      setSelectedModel('');
    }
  };

  useEffect(() => {
    refreshModels();
    refreshSessions();
  }, []);

  const refreshSessions = async () => {
    const data = await api.getSessions();
    setSessions(data);
  };

  const handleNewChat = () => {
    setCurrentSessionId(uuidv4());
    setInitialMessages([]);
  };

  const handleSelectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    const messages = await api.getSessionMessages(sessionId);
    setInitialMessages(messages);
    // Find if a persona was used (simple heuristic or store in DB later)
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    await api.deleteSession(sessionId);
    if (currentSessionId === sessionId) {
      handleNewChat();
    }
    refreshSessions();
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: 'transparent',
      color: 'var(--text-main)',
      overflow: 'hidden'
    }}>
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="glass"
            style={{
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 20,
              borderRight: '1px solid var(--border-glass)'
            }}
          >
            {/* Logo */}
            <div style={{
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${selectedPersona.color}, #fff)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 20px ${selectedPersona.color}40`
              }}>
                <Sparkles size={18} color="#000" />
              </div>
              <span style={{
                fontWeight: 700,
                fontSize: '1.2rem',
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #fff 0%, #a5a5a5 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Local AI
              </span>
            </div>

            {/* Persona Selector */}
            <div style={{ padding: '0 1.25rem 1.5rem' }}>
              <p style={{
                color: 'var(--text-mute)',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '1rem',
                paddingLeft: '0.25rem'
              }}>Persona</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {PERSONAS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPersona(p)}
                    className="glow-card"
                    style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: p.id === selectedPersona.id ? `1px solid ${p.color}` : '1px solid var(--border-glass)',
                      backgroundColor: p.id === selectedPersona.id ? `${p.color}15` : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '8px',
                      textAlign: 'left'
                    }}
                  >
                    <p.icon size={18} color={p.id === selectedPersona.id ? p.color : 'var(--text-dim)'} />
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: p.id === selectedPersona.id ? '#fff' : 'var(--text-dim)'
                    }}>{p.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* New Chat Button */}
            <div style={{ padding: '0 1.25rem 1rem' }}>
              <button
                onClick={handleNewChat}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.2)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <MessageSquarePlus size={18} />
                New Conversation
              </button>
            </div>

            {/* Chat List */}
            <div style={{ flex: 1, padding: '0.5rem 0.75rem', overflowY: 'auto' }}>
              <p style={{
                color: 'var(--text-mute)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '0.5rem 0.75rem'
              }}>History</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {sessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.8rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      backgroundColor: currentSessionId === session.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                      color: currentSessionId === session.id ? '#fff' : 'var(--text-dim)',
                      transition: 'all 0.2s',
                      border: currentSessionId === session.id ? '1px solid var(--border-glass)' : '1px solid transparent'
                    }}
                    onMouseOver={(e) => {
                      if (currentSessionId !== session.id) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                    }}
                    onMouseOut={(e) => {
                      if (currentSessionId !== session.id) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                      <MessageSquare size={16} style={{ flexShrink: 0, opacity: 0.7 }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.title}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-mute)', cursor: 'pointer', padding: '4px' }}
                      onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-mute)'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer / Settings */}
            <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-glass)' }}>
              <button
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-glass)',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
              >
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 10px #10b981'
                }} />
                Ollama: Running
                <Settings size={16} style={{ marginLeft: 'auto' }} />
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 }}>
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'absolute',
            top: '1.25rem',
            left: sidebarOpen ? '-20px' : '1.25rem',
            zIndex: 30,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid var(--border-glass)',
            backgroundColor: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: sidebarOpen ? 0 : 1,
            pointerEvents: sidebarOpen ? 'none' : 'auto'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
        >
          <ChevronRight size={18} />
        </button>

        <ChatInterface
          key={currentSessionId}
          sessionId={currentSessionId}
          initialMessages={initialMessages}
          models={models}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onRefreshModels={refreshModels}
          onChatCreated={refreshSessions}
          persona={selectedPersona}
        />

        {/* Sidebar Toggle Handle for when open */}
        {sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'absolute',
              top: '50%',
              left: '0',
              transform: 'translateY(-50%)',
              zIndex: 30,
              width: '4px',
              height: '40px',
              borderRadius: '0 4px 4px 0',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          />
        )}
      </main>
    </div>
  );
}

export default App;

