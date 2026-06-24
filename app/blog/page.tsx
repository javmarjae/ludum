import type { Metadata } from 'next';
import Link from 'next/link';
import { getBlogPosts, formatBlogDate } from '@/lib/blog';
import { AppNav } from '@/components/AppNav';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 3600; // ISR: revalidar cada hora

export const metadata: Metadata = {
  title: 'Blog de juegos de mesa',
  description: 'Artículos, reseñas, novedades y guías sobre juegos de mesa. Mantente al día con los últimos lanzamientos y noticias del sector.',
  openGraph: {
    title: 'Blog de juegos de mesa',
    description: 'Artículos, reseñas, novedades y guías sobre juegos de mesa.',
    type: 'website',
  },
};

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const posts = await getBlogPosts();
  const [featured, ...rest] = posts;

  return (
    <>
      <AppNav />
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>
              Blog
            </h1>
            <p style={{ fontSize: 16, color: 'var(--text-3)' }}>
              Novedades, reseñas y guías del mundo de los juegos de mesa.
            </p>
          </div>
          {user && (
            <Link
              href="/blog/nueva"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontSize: 14, fontWeight: 700, padding: '10px 18px', borderRadius: 10,
                color: 'white', background: 'var(--brand)', textDecoration: 'none',
                boxShadow: 'var(--shadow-btn-brand)', whiteSpace: 'nowrap',
              }}
            >
              + Nueva entrada
            </Link>
          )}
        </div>

        {posts.length === 0 && (
          <p style={{ color: 'var(--text-3)', fontSize: 15 }}>Próximamente, primeros artículos en camino.</p>
        )}

        {featured && (
          <Link href={`/blog/${featured.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 48 }}>
            <article
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                background: 'var(--bg-card)',
                boxShadow: 'var(--shadow-card)',
                border: '1px solid var(--border)',
                transition: 'box-shadow 0.2s',
              }}
            >
              {featured.cover_image && (
                <img
                  src={featured.cover_image}
                  alt={featured.title}
                  style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }}
                />
              )}
              <div style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  {featured.is_sponsored && <SponsoredBadge name={featured.sponsor_name} />}
                  <TagList tags={featured.tags} />
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text-1)', marginBottom: 10, lineHeight: 1.25 }}>
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>
                    {featured.excerpt}
                  </p>
                )}
                <PostMeta post={featured} />
              </div>
            </article>
          </Link>
        )}

        {rest.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {rest.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
                <article
                  style={{
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: 'var(--bg-card)',
                    boxShadow: 'var(--shadow-card)',
                    border: '1px solid var(--border)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'box-shadow 0.2s',
                  }}
                >
                  {post.cover_image && (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                    />
                  )}
                  <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {post.is_sponsored && <SponsoredBadge name={post.sponsor_name} />}
                      <TagList tags={post.tags} />
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.3, margin: 0 }}>
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5, margin: 0, flex: 1 }}>
                        {post.excerpt}
                      </p>
                    )}
                    <PostMeta post={post} small />
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function SponsoredBadge({ name }: { name: string | null }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: 'white',
        borderRadius: 5,
        padding: '2px 7px',
        whiteSpace: 'nowrap',
      }}
    >
      {name ? `Patrocinado por ${name}` : 'Patrocinado'}
    </span>
  );
}

function TagList({ tags }: { tags: string[] }) {
  if (!tags?.length) return null;
  return (
    <>
      {tags.slice(0, 3).map((tag) => (
        <span
          key={tag}
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--brand)',
            background: 'color-mix(in srgb, var(--brand) 12%, transparent)',
            borderRadius: 4,
            padding: '2px 7px',
          }}
        >
          {tag}
        </span>
      ))}
    </>
  );
}

function PostMeta({ post, small }: { post: any; small?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: small ? 12 : 13, color: 'var(--text-4)' }}>
      <span>{post.author_name}</span>
      <span>·</span>
      <span>{formatBlogDate(post.published_at)}</span>
    </div>
  );
}
