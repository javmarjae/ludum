'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { addGameToUserCollection, removeGameFromUserCollection } from './actions';
import { ImportBGGCollection } from './ImportBGGCollection';

interface Game {
  id: string;
  bgg_id: number;
  name: string;
  year_published: number | null;
  image_url: string | null;
}

interface Props {
  initialCollection: Game[];
}

const inputStyle: React.CSSProperties = {
  flex: 1, background: 'var(--bg-inset)', boxShadow: 'var(--shadow-input)',
  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)',
  padding: '12px 16px', fontSize: 15, fontWeight: 500, outline: 'none',
  fontFamily: 'inherit',
};

export function UserCollectionSection({ initialCollection }: Props) {
  const [collection, setCollection] = useState<Game[]>(initialCollection);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const collectionIds = useMemo(() => new Set(collection.map((g) => g.id)), [collection]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoadingSearch(true);
      const { data } = await supabase
        .from('games')
        .select('id, bgg_id, name, year_published, image_url')
        .ilike('name', `%${query.trim()}%`)
        .order('bgg_rank', { ascending: true, nullsFirst: false })
        .limit(8);
      setSearchResults(data ?? []);
      setLoadingSearch(false);
    }, 300);
  }, [query, supabase]);

  async function toggle(game: Game) {
    setLoadingIds((s) => new Set(s).add(game.id));
    if (collectionIds.has(game.id)) {
      await removeGameFromUserCollection(game.id);
      setCollection((c) => c.filter((g) => g.id !== game.id));
    } else {
      await addGameToUserCollection(game.id);
      setCollection((c) => [...c, game]);
    }
    setLoadingIds((s) => { const n = new Set(s); n.delete(game.id); return n; });
  }

  return (
    <section style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Mi colección</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-4)' }}>{collection.length} juego{collection.length !== 1 ? 's' : ''}</span>
          <ImportBGGCollection />
        </div>
      </div>

      {/* Buscador */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Buscar juego para añadir..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={inputStyle}
        />
        {loadingSearch && (
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-4)', fontWeight: 600 }}>Buscando...</span>
        )}
      </div>

      {/* Resultados de búsqueda */}
      {searchResults.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {searchResults.map((game) => (
            <GameRow key={game.id} game={game} inCollection={collectionIds.has(game.id)} loading={loadingIds.has(game.id)} onToggle={() => toggle(game)} />
          ))}
        </div>
      )}

      {/* Colección actual */}
      {collection.length === 0 ? (
        <div style={{ borderRadius: 10, padding: 36, textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>📦</p>
          <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Colección vacía</p>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)' }}>Busca un juego arriba para añadirlo.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {collection.map((game) => (
            <GameRow key={game.id} game={game} inCollection={true} loading={loadingIds.has(game.id)} onToggle={() => toggle(game)} />
          ))}
        </div>
      )}
    </section>
  );
}

function GameRow({ game, inCollection, loading, onToggle }: { game: Game; inCollection: boolean; loading: boolean; onToggle: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderRadius: 10, padding: '12px 16px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
      <Link href={`/juegos/${game.bgg_id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, textDecoration: 'none', flex: 1 }}>
        {game.image_url
          ? <Image src={game.image_url} alt={game.name} width={40} height={40} style={{ borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: 'var(--bg-inset)' }}>🎲</div>
        }
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.name}</p>
          {game.year_published && <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>{game.year_published}</p>}
        </div>
      </Link>
      <button
        onClick={onToggle}
        disabled={loading}
        style={{
          flexShrink: 0, padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit', transition: 'transform 0.15s',
          background: inCollection ? 'rgba(58,55,47,0.08)' : 'var(--brand-tint)',
          color: inCollection ? 'var(--text-2)' : 'var(--brand)',
          border: inCollection ? '1px solid rgba(58,55,47,0.18)' : '1px solid rgba(62,94,59,0.25)',
          opacity: loading ? 0.5 : 1,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      >
        {loading ? '...' : inCollection ? 'Quitar' : '+ Añadir'}
      </button>
    </div>
  );
}
