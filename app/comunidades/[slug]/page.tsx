import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { AppNav } from '@/components/AppNav';
import { Avatar } from '@/components/Avatar';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { JoinButton } from './JoinButton';
import { CreatePostForm } from './CreatePostForm';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Estrategia': '♟️', 'Temático': '🗺️', 'Guerra': '⚔️',
  'Familiar': '👨‍👩‍👧', 'Cartas': '🃏', 'Abstracto': '🔷',
  'Fiesta': '🎉', 'Infantil': '🧸',
};

export default async function ComunidadDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab = 'posts' } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: community } = await supabase
    .from('communities')
    .select('id, name, slug, description, is_official, image_url, category_id, categories(name)')
    .eq('slug', slug)
    .single();

  if (!community) notFound();

  const { data: membership } = await supabase
    .from('community_members')
    .select('community_id')
    .eq('community_id', community.id)
    .eq('profile_id', user.id)
    .single();

  const isMember = !!membership;
  const categoryName = (community.categories as any)?.name ?? null;
  const icon = CATEGORY_ICONS[categoryName ?? ''] ?? '🧩';

  // Load tab data in parallel
  const [postsRes, membersRes] = await Promise.all([
    supabase
      .from('community_posts')
      .select('id, title, content, created_at, author_id, profiles!author_id(display_name, avatar_url, is_verified)')
      .eq('community_id', community.id)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('community_members')
      .select('profile_id, joined_at, profiles(display_name, avatar_url, is_verified)')
      .eq('community_id', community.id)
      .order('joined_at', { ascending: true })
      .limit(100),
  ]);

  const posts = postsRes.data ?? [];
  const members = membersRes.data ?? [];
  const memberCount = members.length;

  // Feed: public plays from members of games in this category
  let feed: any[] = [];
  if (tab === 'feed') {
    const memberIds = members.map((m: any) => m.profile_id);
    if (memberIds.length > 0) {
      let feedQuery = supabase
        .from('plays')
        .select('id, played_at, games(name, image_url, bgg_id), play_results(is_winner, profiles(display_name), guest_name)')
        .eq('is_public', true)
        .in('created_by', memberIds)
        .order('played_at', { ascending: false })
        .limit(30);

      if (community.category_id) {
        const { data: catGames } = await supabase
          .from('game_categories')
          .select('game_id')
          .eq('category_id', community.category_id)
          .limit(1000);

        const gameIds = (catGames ?? []).map((g: any) => g.game_id);
        if (gameIds.length > 0) {
          feedQuery = feedQuery.in('game_id', gameIds);
        }
      }

      const { data: feedData } = await feedQuery;
      feed = feedData ?? [];
    }
  }

  const tabs = [
    { id: 'posts', label: 'Publicaciones' },
    { id: 'feed', label: 'Actividad' },
    { id: 'miembros', label: `Miembros (${memberCount})` },
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <AppNav back={{ href: '/comunidades', label: 'Comunidades' }} />

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Community header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
            background: 'var(--brand-tint)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                {community.name}
              </h1>
              {community.is_official && (
                <VerifiedBadge size={18} title="Comunidad oficial" />
              )}
            </div>
            {categoryName && (
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', marginBottom: 4 }}>{categoryName}</p>
            )}
            {community.description && (
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.5 }}>{community.description}</p>
            )}
          </div>
          <JoinButton
            communityId={community.id}
            isMember={isMember}
            communitySlug={community.slug}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {tabs.map(t => (
            <Link
              key={t.id}
              href={`/comunidades/${slug}?tab=${t.id}`}
              style={{
                padding: '8px 14px', borderRadius: '8px 8px 0 0', textDecoration: 'none',
                fontSize: 13, fontWeight: 700,
                color: tab === t.id ? 'var(--brand)' : 'var(--text-4)',
                background: tab === t.id ? 'var(--brand-tint)' : 'transparent',
                borderBottom: tab === t.id ? '2px solid var(--brand)' : '2px solid transparent',
                marginBottom: -1,
                transition: 'color 0.12s, background 0.12s',
              }}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Tab: Posts */}
        {tab === 'posts' && (
          <div>
            {isMember && (
              <div style={{ marginBottom: 24 }}>
                <CreatePostForm communityId={community.id} communitySlug={community.slug} />
              </div>
            )}
            {!isMember && (
              <div style={{ borderRadius: 16, padding: '20px 20px', marginBottom: 20, background: 'var(--brand-tint)', textAlign: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand)' }}>
                  Únete a la comunidad para publicar y comentar.
                </p>
              </div>
            )}
            {posts.length === 0 ? (
              <div style={{ borderRadius: 20, padding: '40px 24px', textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                <p style={{ fontSize: 28, marginBottom: 10 }}>📝</p>
                <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Sin publicaciones todavía</p>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)' }}>
                  {isMember ? '¡Sé el primero en publicar!' : 'Únete y empieza la conversación.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {posts.map((post: any) => (
                  <PostCard key={post.id} post={post} communitySlug={slug} userId={user.id} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Feed */}
        {tab === 'feed' && (
          <div>
            {feed.length === 0 ? (
              <div style={{ borderRadius: 20, padding: '40px 24px', textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                <p style={{ fontSize: 28, marginBottom: 10 }}>🎲</p>
                <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Sin actividad reciente</p>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)' }}>
                  {categoryName
                    ? `Todavía no hay partidas públicas de ${categoryName} entre los miembros.`
                    : 'Los miembros aún no han registrado partidas públicas.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {feed.map((play: any) => (
                  <PlayFeedCard key={play.id} play={play} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Members */}
        {tab === 'miembros' && (
          <div style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            {members.map((m: any, i: number) => (
              <Link
                key={m.profile_id}
                href={m.profile_id === user.id ? '/perfil' : `/perfil/${m.profile_id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  textDecoration: 'none',
                }}
              >
                <Avatar
                  name={(m.profiles as any)?.display_name ?? '?'}
                  src={(m.profiles as any)?.avatar_url}
                  size={40}
                  style={{ boxShadow: '0 2px 8px rgba(62,94,59,0.2)' }}
                />
                <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {(m.profiles as any)?.display_name ?? 'Usuario'}
                  {(m.profiles as any)?.is_verified && <VerifiedBadge size={14} title="Perfil verificado" />}
                </span>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)' }}>
                  desde {new Date(m.joined_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                </span>
                <span style={{ color: 'var(--text-4)', fontSize: 16 }}>›</span>
              </Link>
            ))}
            {members.length === 0 && (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)' }}>Sé el primero en unirte.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Post card ── */

function PostCard({ post, communitySlug, userId }: { post: any; communitySlug: string; userId: string }) {
  const author = (post.profiles as any);
  const isOwn = post.author_id === userId;

  return (
    <Link href={`/comunidades/${communitySlug}/posts/${post.id}`} style={{ textDecoration: 'none' }}>
      <div className="hover-scale" style={{
        borderRadius: 18, padding: '18px 20px', background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', lineHeight: 1.35 }}>
          {post.title}
        </p>
        <p style={{
          fontSize: 13, fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        } as React.CSSProperties}>
          {post.content}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <Avatar name={author?.display_name ?? '?'} src={author?.avatar_url} size={22} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)' }}>
            {author?.display_name ?? 'Usuario'}
          </span>
          {author?.is_verified && <VerifiedBadge size={13} title="Perfil verificado" />}
          <span style={{ fontSize: 12, color: 'var(--text-4)' }}>·</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>
            {new Date(post.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
          </span>
          {isOwn && (
            <>
              <span style={{ fontSize: 12, color: 'var(--text-4)' }}>·</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)' }}>Tuyo</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ── Play feed card ── */

function PlayFeedCard({ play }: { play: any }) {
  const winner = (play.play_results ?? []).find((r: any) => r.is_winner);
  const winnerName = winner?.profiles?.display_name ?? winner?.guest_name ?? null;

  return (
    <Link href={`/juegos/${play.games?.bgg_id}`} style={{ textDecoration: 'none' }}>
      <div className="hover-scale" style={{
        display: 'flex', alignItems: 'center', gap: 14, borderRadius: 18, padding: '14px 18px',
        background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)',
      }}>
        {play.games?.image_url
          ? <img src={play.games.image_url} alt={play.games.name} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, background: 'var(--bg-inset)' }}>🎲</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {play.games?.name ?? 'Juego desconocido'}
          </p>
          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>
            {new Date(play.played_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
            {winnerName && <span> · 🏆 {winnerName}</span>}
          </p>
        </div>
      </div>
    </Link>
  );
}
