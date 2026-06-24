import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { AppNav } from '@/components/AppNav';
import { Avatar } from '@/components/Avatar';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { CreateCommentForm } from './CreateCommentForm';
import { deletePost, deleteComment } from '../../../actions';

interface Props {
  params: Promise<{ slug: string; postId: string }>;
}

export default async function PostDetailPage({ params }: Props) {
  const { slug, postId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [{ data: community }, { data: post }, { data: comments }] = await Promise.all([
    supabase
      .from('communities')
      .select('id, name, slug')
      .eq('slug', slug)
      .single(),
    supabase
      .from('community_posts')
      .select('id, title, content, created_at, author_id, profiles!author_id(display_name, avatar_url, is_verified)')
      .eq('id', postId)
      .single(),
    supabase
      .from('community_comments')
      .select('id, content, created_at, author_id, profiles!author_id(display_name, avatar_url, is_verified)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true }),
  ]);

  if (!community || !post) notFound();

  const { data: isMemberRow } = await supabase
    .from('community_members')
    .select('community_id')
    .eq('community_id', community.id)
    .eq('profile_id', user.id)
    .maybeSingle();

  const isMember = !!isMemberRow;
  const isAuthor = post.author_id === user.id;
  const author = (post.profiles as any);
  const commentList = comments ?? [];

  const deletePostAction = deletePost.bind(null, post.id, slug);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <AppNav back={{ href: `/comunidades/${slug}`, label: community.name }} />

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Post */}
        <div style={{ borderRadius: 20, padding: '24px 24px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 16 }}>
            {post.title}
          </h1>
          <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 20 }}>
            {post.content}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <Avatar name={author?.display_name ?? '?'} src={author?.avatar_url} size={28} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5 }}>
              {author?.display_name ?? 'Usuario'}
              {author?.is_verified && <VerifiedBadge size={13} title="Perfil verificado" />}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-4)' }}>·</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-4)' }}>
              {new Date(post.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            {isAuthor && (
              <form action={deletePostAction} style={{ marginLeft: 'auto' }}>
                <button
                  type="submit"
                  style={{
                    padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 700, color: '#c0392b',
                    background: 'rgba(192,57,43,0.08)',
                  }}
                >
                  Eliminar
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Comments header */}
        <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>
          {commentList.length} {commentList.length === 1 ? 'comentario' : 'comentarios'}
        </h2>

        {/* Comment form */}
        {isMember ? (
          <div style={{ marginBottom: 16 }}>
            <CreateCommentForm postId={postId} communitySlug={slug} />
          </div>
        ) : (
          <div style={{ borderRadius: 12, padding: '14px 16px', marginBottom: 16, background: 'var(--brand-tint)', textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>
              <Link href={`/comunidades/${slug}`} style={{ color: 'var(--brand)' }}>Únete a la comunidad</Link> para comentar.
            </p>
          </div>
        )}

        {/* Comments list */}
        {commentList.length === 0 ? (
          <div style={{ borderRadius: 16, padding: '28px 20px', textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)' }}>
              {isMember ? '¡Sé el primero en comentar!' : 'Aún no hay comentarios.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {commentList.map((comment: any) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                isOwn={comment.author_id === user.id}
                postId={postId}
                communitySlug={slug}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CommentCard({ comment, isOwn, postId, communitySlug }: {
  comment: any;
  isOwn: boolean;
  postId: string;
  communitySlug: string;
}) {
  const author = (comment.profiles as any);
  const deleteCommentAction = deleteComment.bind(null, comment.id, postId, communitySlug);

  return (
    <div style={{ borderRadius: 16, padding: '14px 18px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Avatar name={author?.display_name ?? '?'} src={author?.avatar_url} size={26} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {author?.display_name ?? 'Usuario'}
          {author?.is_verified && <VerifiedBadge size={13} title="Perfil verificado" />}
        </span>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>
          {new Date(comment.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
        </span>
        {isOwn && (
          <form action={deleteCommentAction} style={{ marginLeft: 'auto' }}>
            <button
              type="submit"
              style={{
                padding: '3px 9px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 700, color: '#c0392b',
                background: 'rgba(192,57,43,0.08)',
              }}
            >
              ×
            </button>
          </form>
        )}
      </div>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
        {comment.content}
      </p>
    </div>
  );
}
