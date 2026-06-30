import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Props {
  params: Promise<{ playId: string }>;
}

export default async function PublicPlayPage({ params }: Props) {
  const { playId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_public_play', { play_id: playId });

  if (error || !data) notFound();

  const play = data as {
    id: string;
    played_at: string;
    notes: string | null;
    game_name: string;
    game_image: string | null;
    group_name: string;
    results: Array<{ id: string; score: number | null; is_winner: boolean; player_name: string }> | null;
  };

  const date = new Date(play.played_at).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const results = play.results ?? [];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Minimal nav */}
      <header className="app-nav" style={{
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/logo.svg" alt="Ludum" style={{ height: 32, width: 'auto' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--brand)' }}>Ludum</span>
          </Link>
          <Link href="/auth/login" style={{
            fontSize: 13, fontWeight: 700, padding: '7px 16px', borderRadius: 999,
            textDecoration: 'none', color: 'white', background: 'var(--brand)',
            boxShadow: 'var(--shadow-btn-brand)',
          }}>
            Entrar
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Chip de grupo */}
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Partida de
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', background: 'var(--brand-tint)', padding: '3px 10px', borderRadius: 999 }}>
            {play.group_name}
          </span>
        </div>

        {/* Cabecera juego */}
        <div style={{ borderRadius: 32, padding: 24, marginBottom: 20, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', display: 'flex', gap: 16, alignItems: 'center' }}>
          {play.game_image
            ? <Image src={play.game_image} alt={play.game_name} width={72} height={72} style={{ borderRadius: 16, objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 72, height: 72, borderRadius: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, background: 'var(--bg-inset)' }}>🎲</div>
          }
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text)', marginBottom: 4 }}>
              {play.game_name}
            </h1>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)', textTransform: 'capitalize' }}>{date}</p>
          </div>
        </div>

        {/* Resultados */}
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Resultados</h2>
          <div style={{ borderRadius: 24, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            {results.length === 0 ? (
              <p style={{ padding: '24px 20px', fontSize: 14, color: 'var(--text-3)', textAlign: 'center' }}>Sin resultados registrados.</p>
            ) : results.map((r, i) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 18px', borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                background: r.is_winner ? 'var(--brand-tint)' : 'transparent',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800,
                  background: r.is_winner ? 'linear-gradient(135deg, #89BA86, #3E5E3B)' : 'var(--bg-inset)',
                  color: r.is_winner ? 'white' : 'var(--text-4)',
                  boxShadow: r.is_winner ? '0 2px 8px rgba(62,94,59,0.2)' : 'none',
                }}>
                  {r.is_winner ? '🏆' : i + 1}
                </div>
                <span style={{ flex: 1, fontWeight: 700, fontSize: 15, color: r.is_winner ? 'var(--brand)' : 'var(--text)' }}>{r.player_name}</span>
                {r.score != null && (
                  <span style={{ fontSize: 18, fontWeight: 800, color: r.is_winner ? 'var(--brand)' : 'var(--text-3)' }}>
                    {r.score}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Notas */}
        {play.notes && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Notas</h2>
            <div style={{ borderRadius: 24, padding: '16px 20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{play.notes}</p>
            </div>
          </section>
        )}

        {/* CTA */}
        <div style={{ borderRadius: 24, padding: '20px 24px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 12 }}>
            ¿Quieres registrar tus propias partidas?
          </p>
          <Link href="/auth/login" style={{
            display: 'inline-flex', padding: '10px 24px', borderRadius: 999,
            fontSize: 14, fontWeight: 700, textDecoration: 'none',
            color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)',
          }}>
            Únete a Ludum gratis
          </Link>
        </div>
      </main>
    </div>
  );
}
