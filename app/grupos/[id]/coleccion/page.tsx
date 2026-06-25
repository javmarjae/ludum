import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Image from 'next/image';
import { AppNav } from '@/components/AppNav';
import { AddGameButton } from './AddGameButton';
import { ColeccionFilter } from './ColeccionFilter';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}

const inputStyle = {
  background: 'var(--bg-inset)', boxShadow: 'var(--shadow-input)', border: '1px solid var(--border)',
  borderRadius: 16, color: 'var(--text)', padding: '12px 16px', fontSize: 15,
  fontWeight: 500, outline: 'none', fontFamily: 'inherit', flex: 1,
};

export default async function ColeccionPage({ params, searchParams }: Props) {
  const { id: groupId } = await params;
  const { q } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: group } = await supabase.from('groups').select('id, name').eq('id', groupId).single();
  if (!group) notFound();

  const { data: membership } = await supabase.from('group_members').select('group_id').eq('group_id', groupId).eq('profile_id', user.id).single();
  if (!membership) redirect('/grupos');

  const { data: collection } = await supabase
    .from('group_games')
    .select('game_id, games(id, bgg_id, name, year_published, bgg_rating, image_url)')
    .eq('group_id', groupId);

  const collectionGameIds = new Set(collection?.map((c) => c.game_id) ?? []);

  let searchResults: any[] = [];
  if (q && q.length >= 2) {
    const { data } = await supabase
      .from('games')
      .select('id, bgg_id, name, year_published, bgg_rating, image_url')
      .ilike('name', `%${q}%`)
      .order('bgg_rank', { ascending: true, nullsFirst: false })
      .limit(10);
    searchResults = data ?? [];
  }

  const collectionGames = collection?.map((c) => c.games).filter(Boolean) ?? [];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <AppNav back={{ href: `/grupos/${groupId}`, label: group.name }} />

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '48px clamp(16px,4vw,32px) 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 4 }}>Colección</h1>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)' }}>{collectionGames.length} juego{collectionGames.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Search */}
        <form method="GET" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input name="q" defaultValue={q} placeholder="Buscar juego para añadir..." style={inputStyle as any} />
            <button type="submit" style={{
              padding: '12px 20px', borderRadius: 999, fontWeight: 700, fontSize: 14,
              color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            }}>
              Buscar
            </button>
          </div>
        </form>

        {/* Search results */}
        {q && searchResults.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', marginBottom: 12 }}>
              Resultados para "{q}"
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {searchResults.map((game) => (
                <div key={game.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderRadius: 22, padding: '16px 20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    {game.image_url
                      ? <div style={{ position: 'relative', width: 40, height: 54, borderRadius: 14, overflow: 'hidden', flexShrink: 0 }}>
                          <Image src={game.image_url} alt={game.name} fill style={{ objectFit: 'cover' }} />
                        </div>
                      : <div style={{ width: 40, height: 54, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: 'var(--bg-inset)' }}>🎲</div>
                    }
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.name}</p>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>{game.year_published}</p>
                    </div>
                  </div>
                  <AddGameButton groupId={groupId} gameId={game.id} inCollection={collectionGameIds.has(game.id)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {q && searchResults.length === 0 && (
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', marginBottom: 32 }}>Sin resultados para "{q}".</p>
        )}

        {/* Current collection */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>
            En la colección ({collectionGames.length})
          </h2>

          {collectionGames.length === 0 ? (
            <div style={{ borderRadius: 24, padding: 40, textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>📦</p>
              <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Colección vacía</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)' }}>Busca un juego arriba para añadirlo.</p>
            </div>
          ) : (
            <ColeccionFilter games={collectionGames as any[]} groupId={groupId} />
          )}
        </div>
      </main>
    </div>
  );
}
