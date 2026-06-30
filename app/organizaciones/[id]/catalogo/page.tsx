import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { AppNav } from '@/components/AppNav';
import { AddCatalogButton } from './AddCatalogButton';
import { CatalogGame } from './CatalogGame';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; filtro?: string }>;
}

type Status = 'disponible' | 'en_venta' | 'en_prestamo';

const STATUS_LABEL: Record<string, string> = {
  todos: 'Todos',
  disponible: 'Disponibles',
  en_venta: 'En venta',
  en_prestamo: 'Préstamo',
};

const inputStyle = {
  background: 'var(--bg-inset)', boxShadow: 'var(--shadow-input)', border: '1px solid var(--border)',
  borderRadius: 16, color: 'var(--text)', padding: '12px 16px', fontSize: 15,
  fontWeight: 500, outline: 'none', fontFamily: 'inherit', flex: 1,
};

export default async function CatalogoPage({ params, searchParams }: Props) {
  const { id: orgId } = await params;
  const { q, filtro = 'todos' } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: org } = await supabase.from('organizations').select('id, name, type, owner_id').eq('id', orgId).single();
  if (!org) notFound();

  // Check if user is owner or admin
  let canManage = false;
  if (user) {
    if (user.id === org.owner_id) {
      canManage = true;
    } else {
      const { data: member } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('profile_id', user.id)
        .single();
      canManage = member?.role === 'admin';
    }
  }

  // Fetch catalog
  let catalogQuery = supabase
    .from('organization_catalog')
    .select('game_id, status, price, notes, added_at, games(id, name, year_published, image_url, bgg_rating)')
    .eq('organization_id', orgId)
    .order('added_at', { ascending: false });

  if (filtro && filtro !== 'todos') {
    catalogQuery = catalogQuery.eq('status', filtro as Status);
  }

  const { data: catalog } = await catalogQuery;
  const catalogGameIds = new Set(catalog?.map(c => c.game_id) ?? []);

  // Search games to add (only for managers)
  let searchResults: any[] = [];
  if (canManage && q && q.length >= 2) {
    const { data } = await supabase
      .from('games')
      .select('id, name, year_published, bgg_rating, image_url')
      .ilike('name', `%${q}%`)
      .order('bgg_rank', { ascending: true, nullsFirst: false })
      .limit(10);
    searchResults = data ?? [];
  }

  const catalogEntries = catalog ?? [];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <AppNav back={{ href: `/organizaciones/${orgId}`, label: org.name }} />

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '48px clamp(16px,4vw,32px) 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 4 }}>
            Catálogo
          </h1>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)' }}>
            {org.type === 'tienda' ? '🏪' : '🎲'} {org.name} · {catalogEntries.length} juego{catalogEntries.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Search — solo para gestores */}
        {canManage && (
          <form method="GET" style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input name="q" defaultValue={q} placeholder="Buscar juego para añadir al catálogo..." style={inputStyle as any} />
              <button type="submit" style={{
                padding: '12px 20px', borderRadius: 999, fontWeight: 700, fontSize: 14,
                color: 'white', background: 'var(--brand)', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', flexShrink: 0,
              }}>
                Buscar
              </button>
            </div>
          </form>
        )}

        {/* Resultados de búsqueda */}
        {canManage && q && searchResults.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', marginBottom: 12 }}>
              Resultados para "{q}"
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {searchResults.map(game => (
                <div key={game.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderRadius: 22, padding: '16px 20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    {game.image_url
                      ? <Image src={game.image_url} alt={game.name} width={50} height={50} style={{ borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 50, height: 50, borderRadius: 14, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🎲</div>
                    }
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.name}</p>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>{game.year_published}</p>
                    </div>
                  </div>
                  <AddCatalogButton orgId={orgId} gameId={game.id} inCatalog={catalogGameIds.has(game.id)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {canManage && q && searchResults.length === 0 && (
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', marginBottom: 32 }}>Sin resultados para "{q}".</p>
        )}

        {/* Filtros de estado */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {['todos', 'disponible', 'en_venta', 'en_prestamo'].map(f => (
            <a
              key={f}
              href={`/organizaciones/${orgId}/catalogo${f !== 'todos' ? `?filtro=${f}` : ''}`}
              style={{
                padding: '7px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                textDecoration: 'none', transition: 'all 0.15s',
                background: filtro === f ? 'var(--brand)' : 'var(--bg-card)',
                color: filtro === f ? 'white' : 'var(--text-2)',
                boxShadow: filtro === f ? 'var(--shadow-btn-brand)' : 'var(--shadow-card)',
              }}
            >
              {STATUS_LABEL[f]}
            </a>
          ))}
        </div>

        {/* Catálogo */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>
            {STATUS_LABEL[filtro] ?? 'Catálogo'} ({catalogEntries.length})
          </h2>

          {catalogEntries.length === 0 ? (
            <div style={{ borderRadius: 24, padding: 40, textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>📦</p>
              <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Sin juegos en el catálogo</p>
              {canManage
                ? <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)' }}>Usa el buscador para añadir juegos.</p>
                : <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)' }}>Esta organización todavía no ha añadido juegos.</p>
              }
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {catalogEntries.map(entry => {
                const game = (entry as any).games;
                if (!game) return null;
                return canManage ? (
                  <CatalogGame
                    key={entry.game_id}
                    orgId={orgId}
                    game={game}
                    entry={{ status: entry.status as Status, price: entry.price, notes: entry.notes }}
                  />
                ) : (
                  <PublicCatalogRow key={entry.game_id} game={game} entry={{ status: entry.status as Status, price: entry.price, notes: entry.notes }} />
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Vista pública (solo lectura)
function PublicCatalogRow({ game, entry }: {
  game: { id: string; name: string; year_published: number | null; image_url: string | null };
  entry: { status: Status; price: number | null; notes: string | null };
}) {
  const STATUS_COLOR: Record<Status, string> = {
    disponible: '#6b7280', en_venta: '#16a34a', en_prestamo: '#2563eb',
  };
  const STATUS_BG: Record<Status, string> = {
    disponible: 'rgba(107,114,128,0.12)', en_venta: 'rgba(22,163,74,0.10)', en_prestamo: 'rgba(37,99,235,0.10)',
  };
  const STATUS_LABEL: Record<Status, string> = {
    disponible: 'Disponible', en_venta: 'En venta', en_prestamo: 'Préstamo',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 20, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
      {game.image_url
        ? <Image src={game.image_url} alt={game.name} width={54} height={54} style={{ borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
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
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)' }}>{entry.notes}</span>
          )}
        </div>
      </div>
    </div>
  );
}
