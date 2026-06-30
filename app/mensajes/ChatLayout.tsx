'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/Avatar';

type Conv = {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message_content: string | null;
  last_message_at: string | null;
  last_message_sender: string | null;
  unread_count: number;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

const QUICK_REPLIES = ['👍', '¡Perfecto!', 'Gracias', '¿Cuándo quedamos?', 'No puedo'];

export function ChatLayout({
  initialConversations,
  userId,
}: {
  initialConversations: Conv[];
  userId: string;
}) {
  const params = useSearchParams();
  const [conversations, setConversations] = useState<Conv[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(params.get('c'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const selected = conversations.find(c => c.id === selectedId) ?? null;

  /* ── Load messages when conversation changes ── */
  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }

    supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, created_at, read_at')
      .eq('conversation_id', selectedId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => setMessages(data ?? []));

    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', selectedId)
      .neq('sender_id', userId)
      .is('read_at', null)
      .then(() => {
        setConversations(prev =>
          prev.map(c => c.id === selectedId ? { ...c, unread_count: 0 } : c)
        );
      });
  }, [selectedId]);

  /* ── Scroll to bottom ──
     block: 'nearest' es clave: sin él, scrollIntoView intenta encuadrar
     el elemento en TODOS los contenedores con scroll ancestros, incluida
     la página entera (el layout añade un <Footer/> debajo del chat, así
     que el documento es más alto que el viewport). Con 'nearest' solo
     desplaza el contenedor interno de mensajes. */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  /* ── Realtime: new messages in current conversation ── */
  useEffect(() => {
    if (!selectedId) return;
    const channel = supabase
      .channel(`chat-${selectedId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${selectedId}`,
      }, (payload) => {
        const msg = payload.new as Message;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.sender_id !== userId) {
          supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', msg.id).then(() => {});
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedId]);

  /* ── Realtime: update conversation list last message ── */
  useEffect(() => {
    const channel = supabase
      .channel('conv-list-updates')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
      }, (payload) => {
        const msg = payload.new as Message;
        setConversations(prev => prev.map(c => {
          if (c.id !== msg.conversation_id) return c;
          const isUnread = msg.sender_id !== userId && msg.conversation_id !== selectedId;
          return {
            ...c,
            last_message_content: msg.content,
            last_message_at: msg.created_at,
            last_message_sender: msg.sender_id,
            unread_count: isUnread ? c.unread_count + 1 : c.unread_count,
          };
        }));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedId]);

  async function handleSend(content = input) {
    const text = content.trim();
    if (!selectedId || !text || sending) return;
    setSending(true);
    setInput('');

    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId, conversation_id: selectedId, sender_id: userId,
      content: text, created_at: new Date().toISOString(), read_at: null,
    };
    setMessages(prev => [...prev, tempMsg]);

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: selectedId, sender_id: userId, content: text })
      .select('id, conversation_id, sender_id, content, created_at, read_at')
      .single();

    if (!error && data) {
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    } else {
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
    setSending(false);
  }

  return (
    <div
      className={selectedId ? 'chat-container chat-selected' : 'chat-container'}
      style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}
    >

      {/* ── Conversation list ── */}
      <div className="chat-sidebar" style={{
        width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column',
        borderRight: '1px solid var(--border)', background: 'var(--bg-card)',
      }}>
        <div style={{ padding: '24px 20px 14px', borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Mensajes
          </h1>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 36, marginBottom: 10 }}>💬</p>
              <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Sin mensajes</p>
              <p style={{ fontSize: 13, color: 'var(--text-4)', fontWeight: 500, lineHeight: 1.5 }}>
                Ve al perfil de alguien y pulsa "Mensaje" para empezar.
              </p>
            </div>
          ) : conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 18px', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: selectedId === conv.id ? 'var(--brand-tint)' : 'transparent',
                transition: 'background 0.12s',
              }}
            >
              <Avatar name={conv.other_user_name} src={conv.other_user_avatar} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {conv.other_user_name ?? 'Usuario'}
                  </p>
                  {conv.last_message_at && (
                    <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)', flexShrink: 0, marginLeft: 6 }}>
                      {fmtTime(conv.last_message_at)}
                    </p>
                  )}
                </div>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.last_message_content
                    ? (conv.last_message_sender === userId ? 'Tú: ' : '') + conv.last_message_content
                    : 'Inicia la conversación'}
                </p>
              </div>
              {conv.unread_count > 0 && (
                <span style={{
                  minWidth: 20, height: 20, borderRadius: 10, flexShrink: 0,
                  background: 'var(--brand)', color: 'white',
                  fontSize: 10, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
                }}>
                  {conv.unread_count > 9 ? '9+' : conv.unread_count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat window ── */}
      {selected ? (
        <div className="chat-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '0 20px', height: 62, flexShrink: 0,
            borderBottom: '1px solid var(--border)', background: 'var(--bg-card)',
          }}>
            <button onClick={() => setSelectedId(null)} aria-label="Volver a conversaciones" style={{
              width: 34, height: 34, borderRadius: '50%', border: 'none',
              background: 'var(--bg-inset)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-3)', fontSize: 18, flexShrink: 0,
            }}>←</button>
            <Avatar name={selected.other_user_name} src={selected.other_user_avatar} size={36} />
            <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', flex: 1 }}>
              {selected.other_user_name ?? 'Usuario'}
            </p>
            <a href={`/perfil/${selected.other_user_id}`}
              style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, background: 'var(--brand-tint)' }}>
              Ver perfil
            </a>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-4)', fontSize: 14, fontWeight: 500 }}>Di hola 👋</p>
              </div>
            )}
            {messages.map((msg, i) => {
              const isMe = msg.sender_id === userId;
              const prev = i > 0 ? messages[i - 1] : null;
              const showDate = !prev || !sameDay(msg.created_at, prev.created_at);
              const isTemp = msg.id.startsWith('temp-');
              return (
                <div key={msg.id}>
                  {showDate && (
                    <div style={{ textAlign: 'center', margin: '14px 0 8px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', background: 'var(--bg-inset)', borderRadius: 99, padding: '3px 12px' }}>
                        {fmtDate(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
                    <div style={{
                      maxWidth: '68%', padding: '10px 15px',
                      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isMe ? 'var(--brand)' : 'var(--bg-card)',
                      color: isMe ? 'white' : 'var(--text)',
                      boxShadow: isMe ? '0 2px 12px rgba(62,94,59,0.25)' : 'var(--shadow-card)',
                      fontSize: 14, fontWeight: 500, lineHeight: 1.5,
                      wordBreak: 'break-word',
                      opacity: isTemp ? 0.6 : 1,
                      transition: 'opacity 0.2s',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          {/* Quick replies */}
          <div style={{ padding: '8px 20px 4px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {QUICK_REPLIES.map(r => (
              <button key={r} onClick={() => handleSend(r)} style={{
                padding: '5px 13px', borderRadius: 99,
                border: '1.5px solid var(--border)',
                background: 'var(--bg-card)', color: 'var(--text-2)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                boxShadow: 'var(--shadow-btn)',
                transition: 'background 0.12s',
              }}>
                {r}
              </button>
            ))}
          </div>

          {/* Input bar */}
          <div style={{
            padding: '8px 16px 16px', display: 'flex', gap: 10, alignItems: 'center',
            borderTop: '1px solid var(--border)', background: 'var(--bg-card)',
            flexShrink: 0,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Escribe un mensaje..."
              style={{
                flex: 1, padding: '11px 18px', borderRadius: 999,
                border: '1.5px solid var(--border)', background: 'var(--bg)',
                fontSize: 14, fontWeight: 500, color: 'var(--text)', outline: 'none',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              aria-label="Enviar mensaje"
              style={{
                width: 44, height: 44, borderRadius: '50%', border: 'none', flexShrink: 0,
                background: input.trim() ? 'var(--brand)' : 'var(--bg-inset)',
                color: input.trim() ? 'white' : 'var(--text-4)',
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s, color 0.15s',
                boxShadow: input.trim() ? '0 2px 10px rgba(62,94,59,0.3)' : 'none',
              }}
            >
              <SendSvg />
            </button>
          </div>
        </div>
      ) : (
        <div className="chat-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <p style={{ fontSize: 52 }}>💬</p>
          <p style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>Tus mensajes</p>
          <p style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>Selecciona una conversación para chatear</p>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────── */

function SendSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

/* ── Date helpers ───────────────────────────────── */

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function fmtTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (mins < 10080) return d.toLocaleDateString('es-ES', { weekday: 'short' });
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(dateStr, today.toISOString())) return 'Hoy';
  if (sameDay(dateStr, yesterday.toISOString())) return 'Ayer';
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}
