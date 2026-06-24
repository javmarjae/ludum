import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getBlogPost, getBlogSlugs, formatBlogDate } from '@/lib/blog';
import { AppNav } from '@/components/AppNav';

export const revalidate = 3600; // ISR: revalidar cada hora

export async function generateStaticParams() {
  const slugs = await getBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};

  return {
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt ?? undefined,
    openGraph: {
      title: post.seo_title ?? post.title,
      description: post.seo_description ?? post.excerpt ?? undefined,
      type: 'article',
      publishedTime: post.published_at,
      authors: [post.author_name],
      ...(post.cover_image ? { images: [post.cover_image] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo_title ?? post.title,
      description: post.seo_description ?? post.excerpt ?? undefined,
      images: post.cover_image ? [post.cover_image] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt ?? undefined,
    datePublished: post.published_at,
    author: { '@type': 'Person', name: post.author_name },
    publisher: { '@type': 'Organization', name: 'Ludum', url: 'https://ludum.es' },
    url: `https://ludum.es/blog/${post.slug}`,
    ...(post.cover_image ? { image: post.cover_image } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AppNav back={{ href: '/blog', label: 'Blog' }} />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Header del artículo */}
        <header style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {post.is_sponsored && <SponsoredBanner post={post} />}
            {post.tags?.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--brand)',
                  background: 'color-mix(in srgb, var(--brand) 12%, transparent)',
                  borderRadius: 5,
                  padding: '3px 9px',
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36,
              fontWeight: 800,
              color: 'var(--text-1)',
              lineHeight: 1.2,
              marginBottom: 16,
            }}
          >
            {post.title}
          </h1>

          {post.excerpt && (
            <p style={{ fontSize: 18, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 20 }}>
              {post.excerpt}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--text-4)', paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-3)' }}>{post.author_name}</span>
            <span>·</span>
            <span>{formatBlogDate(post.published_at)}</span>
          </div>
        </header>

        {post.cover_image && (
          <img
            src={post.cover_image}
            alt={post.title}
            style={{ width: '100%', borderRadius: 14, marginBottom: 40, display: 'block', maxHeight: 400, objectFit: 'cover' }}
          />
        )}

        {/* Contenido markdown */}
        <div className="blog-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Patrocinador (pie de artículo) */}
        {post.is_sponsored && post.sponsor_name && (
          <aside
            style={{
              marginTop: 56,
              padding: '20px 24px',
              borderRadius: 12,
              background: 'var(--bg-inset)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            {post.sponsor_logo && (
              <img src={post.sponsor_logo} alt={post.sponsor_name} style={{ height: 36, objectFit: 'contain' }} />
            )}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-4)', margin: 0 }}>
                Contenido patrocinado por
              </p>
              {post.sponsor_url ? (
                <a
                  href={post.sponsor_url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}
                >
                  {post.sponsor_name} →
                </a>
              ) : (
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{post.sponsor_name}</span>
              )}
            </div>
          </aside>
        )}

        {/* CTA volver */}
        <div style={{ marginTop: 56, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
          <Link
            href="/blog"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--brand)',
              textDecoration: 'none',
            }}
          >
            ← Volver al blog
          </Link>
        </div>
      </main>
    </>
  );
}

function SponsoredBanner({ post }: { post: { sponsor_name: string | null } }) {
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
        padding: '3px 8px',
      }}
    >
      {post.sponsor_name ? `Patrocinado por ${post.sponsor_name}` : 'Patrocinado'}
    </span>
  );
}
