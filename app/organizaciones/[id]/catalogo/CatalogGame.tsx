'use client';

import { useState } from 'react';
import { updateCatalogEntry, removeGameFromCatalog } from '../../actions';

type Status = 'disponible' | 'en_venta' | 'en_prestamo';

interface Props {
  orgId: string;
  game: {
    id: string;
    name: string;
    year_published: number | null;
    image_url: string | null;
    bgg_rating: number | null;
  };
  entry: {
    status: Status;
    price: number | null;
    notes: string | null;
  };
}

const STATUS_LABEL: Record<Status, string> = {
  disponible: 'Disponible',
  en_venta: 'En venta',
  en_prestamo: 'Préstamo',
};

const STATUS_COLOR: Record<Status, string> = {
  disponible: '#6b7280',
  en_venta: '#16a34a',
  en_prestamo: '#2563eb',
};

const STATUS_BG: Record<Status, string> = {
  disponible: 'rgba(107,114,128,0.12)',
  en_venta: 'rgba(22,163,74,0.10)',
  en_prestamo: 'rgba(37,99,235,0.10)',
};

export function CatalogGame({ orgId, game, entry }: Props) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<Status>(entry.status);
  const [price, setPrice] = useState<string>(entry.price != null ? String(entry.price) : '');
  const [notes, setNotes] = useState(entry.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function save() {
    setSaving(true);
    await updateCatalogEntry(orgId, game.id, {
      status,
      price: status === 'en_venta' && price ? parseFloat(price) : null,
      notes: notes.trim() || null,
    });
    setSaving(false);
    setEditing(false);
  }

  async function remove() {
    if (!confirm(`¿Quitar "${game.name}" del catálogo?`)) return;
    setRemoving(true);
    await removeGameFromCatalog(orgId, game.id);
  }

  return (
    <div style={{
      borderRadius: 20, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
        {game.image_url
          ? <img src={game.image_url} alt={game.name} style={{ width: 54, height: 54, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 54, height: 54, borderRadius: 14, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🎲</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.name}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 10px',
              color: STATUS_COLOR[entry.status], background: STATUS_BG[entry.status],
            }}>
              {STATUS_LABEL[entry.status]}
            </span>
            {entry.status === 'en_venta' && entry.price != null && (
              <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{entry.price.toFixed(2)} €</span>
            )}
            {entry.notes && (
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{entry.notes}</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => setEditing(e => !e)}
            style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: 'var(--bg-inset)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
          >
            {editing ? 'Cancelar' : 'Editar'}
          </button>
          <button
            onClick={remove}
            disabled={removing}
            style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)', opacity: removing ? 0.5 : 1 }}
          >
            Quitar
          </button>
        </div>
      </div>

      {editing && (
        <div style={{ padding: '0 20px 18px', borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['disponible', 'en_venta', 'en_prestamo'] as Status[]).map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                style={{
                  padding: '7px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  background: status === s ? STATUS_BG[s] : 'var(--bg-inset)',
                  color: status === s ? STATUS_COLOR[s] : 'var(--text-3)',
                  border: status === s ? `1.5px solid ${STATUS_COLOR[s]}` : '1.5px solid transparent',
                }}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          {status === 'en_venta' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="Precio (€)"
                value={price}
                onChange={e => setPrice(e.target.value)}
                style={{
                  background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 12,
                  padding: '9px 14px', fontSize: 14, fontWeight: 600, color: 'var(--text)',
                  fontFamily: 'inherit', outline: 'none', width: 140,
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)' }}>€</span>
            </div>
          )}

          <input
            type="text"
            placeholder="Nota opcional..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={200}
            style={{
              background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '9px 14px', fontSize: 14, fontWeight: 500, color: 'var(--text)',
              fontFamily: 'inherit', outline: 'none',
            }}
          />

          <button
            onClick={save}
            disabled={saving}
            style={{
              alignSelf: 'flex-start', padding: '9px 22px', borderRadius: 999, fontSize: 13,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              background: 'var(--brand)', color: 'white',
              border: 'none', opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      )}
    </div>
  );
}
