'use client';

import { useState } from 'react';
import { deletePlay, updatePlayNotes, updatePlayVisibility } from '../../actions';

interface Props {
  playId: string;
  groupId: string;
  initialNotes: string;
  initialIsPublic: boolean;
  onVisibilityChange?: (isPublic: boolean) => void;
}

export function PlayActions({ playId, groupId, initialNotes, initialIsPublic, onVisibilityChange }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notesError, setNotesError] = useState('');
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [savingVisibility, setSavingVisibility] = useState(false);

  async function handleToggleVisibility() {
    setSavingVisibility(true);
    const next = !isPublic;
    const res = await updatePlayVisibility(playId, groupId, next);
    setSavingVisibility(false);
    if (!res?.error) {
      setIsPublic(next);
      onVisibilityChange?.(next);
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    setNotesError('');
    const res = await updatePlayNotes(playId, groupId, notes);
    setSavingNotes(false);
    if (res?.error) { setNotesError(res.error); return; }
    setEditingNotes(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await deletePlay(playId, groupId);
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-inset)', boxShadow: 'var(--shadow-input)',
    border: '1px solid var(--border)', borderRadius: 16, color: 'var(--text)',
    width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 500,
    outline: 'none', fontFamily: 'inherit', resize: 'none',
  };

  return (
    <>
      {/* Notas editables */}
      <section style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Notas</h2>
          {!editingNotes && (
            <button onClick={() => setEditingNotes(true)} style={{
              fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 999,
              background: 'var(--bg-card)', boxShadow: 'var(--shadow-btn)', border: 'none',
              color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {notes ? 'Editar' : '+ Añadir notas'}
            </button>
          )}
        </div>

        {editingNotes ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="¿Algo memorable de esta partida?"
              rows={3}
              style={inputStyle}
            />
            {notesError && <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>{notesError}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSaveNotes} disabled={savingNotes} style={{
                flex: 1, padding: '10px', borderRadius: 999, fontWeight: 700, fontSize: 14,
                color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: savingNotes ? 0.6 : 1,
              }}>
                {savingNotes ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => { setEditingNotes(false); setNotes(initialNotes); }} style={{
                padding: '10px 16px', borderRadius: 999, fontWeight: 700, fontSize: 14,
                background: 'var(--bg-card)', boxShadow: 'var(--shadow-btn)', border: 'none',
                color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Cancelar
              </button>
            </div>
          </div>
        ) : notes ? (
          <div style={{ borderRadius: 24, padding: '16px 20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{notes}</p>
          </div>
        ) : (
          <div style={{ borderRadius: 24, padding: '14px 20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-4)' }}>Sin notas.</p>
          </div>
        )}
      </section>

      {/* Visibilidad */}
      <section style={{ marginBottom: 20 }}>
        <div style={{ borderRadius: 20, padding: '16px 20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
              {isPublic ? '🌐 Partida pública' : '🔒 Partida privada'}
            </p>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)' }}>
              {isPublic ? 'Cualquiera con el enlace puede verla' : 'Solo los miembros del grupo pueden verla'}
            </p>
          </div>
          <button
            onClick={handleToggleVisibility}
            disabled={savingVisibility}
            style={{
              width: 44, height: 24, borderRadius: 999, border: 'none', cursor: savingVisibility ? 'default' : 'pointer',
              background: isPublic ? 'var(--brand)' : 'var(--bg-inset)',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              boxShadow: isPublic ? 'var(--shadow-btn-brand)' : 'var(--shadow-input)',
              opacity: savingVisibility ? 0.6 : 1,
            }}
          >
            <span style={{
              position: 'absolute', top: 3, left: isPublic ? 23 : 3, width: 18, height: 18,
              borderRadius: '50%', background: 'white',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>
      </section>

      {/* Eliminar partida */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 4 }}>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} style={{
            width: '100%', padding: '12px', borderRadius: 999, fontWeight: 700, fontSize: 14,
            background: 'none', border: '1.5px solid var(--border)', color: 'var(--text-4)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Eliminar partida
          </button>
        ) : (
          <div style={{ borderRadius: 20, padding: '16px 20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>¿Eliminar esta partida?</p>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)', marginBottom: 14 }}>Esta acción es irreversible.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleDelete} disabled={deleting} style={{
                flex: 1, padding: '10px', borderRadius: 999, fontWeight: 700, fontSize: 14,
                background: '#dc2626', border: 'none', color: 'white',
                cursor: 'pointer', fontFamily: 'inherit', opacity: deleting ? 0.6 : 1,
              }}>
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
              <button onClick={() => setConfirmDelete(false)} style={{
                padding: '10px 16px', borderRadius: 999, fontWeight: 700, fontSize: 14,
                background: 'var(--bg-inset)', border: 'none', color: 'var(--text-3)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
