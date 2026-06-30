import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';

export async function ExpansionBanner({ parentBggId }: { parentBggId: number }) {
  const supabase = await createClient();
  const { data: parentGame } = await supabase
    .from('games')
    .select('bgg_id, name, image_url')
    .eq('bgg_id', parentBggId)
    .single();

  if (!parentGame) return <span className="t-card-sub">🧩 Expansión</span>;

  return (
    <Link href={`/juegos/${parentGame.bgg_id}`} style={{ textDecoration: 'none' }}>
      <div style={{ borderRadius: 16, padding: '10px 16px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        {parentGame.image_url && (
          <Image src={parentGame.image_url} alt="" width={28} height={28} style={{ borderRadius: 8, objectFit: 'cover' }} />
        )}
        <span className="t-card-sub" style={{ color: 'var(--text-3)' }}>Expansión de </span>
        <span className="t-card-sub" style={{ color: 'var(--brand)' }}>{parentGame.name} →</span>
      </div>
    </Link>
  );
}
