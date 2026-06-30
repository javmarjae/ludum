import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';

interface Props {
  gameId: number;
  bggId: number;
  isExpansion: boolean;
  mechanics: string[];
  categories: string[];
}

export async function GameRelatedLists({ gameId, bggId, isExpansion, mechanics, categories }: Props) {
  const supabase = await createClient();
  const filterCol = mechanics.length > 0 ? 'mechanics' : 'categories';
  const filterArr = mechanics.length > 0 ? mechanics.slice(0, 5) : categories.slice(0, 5);

  const [expansionsResult, similarResult] = await Promise.all([
    !isExpansion
      ? supabase.from('games').select('bgg_id, name, image_url, year_published').eq('parent_bgg_id', bggId).order('year_published', { ascending: true }).limit(20)
      : Promise.resolve({ data: [] }),
    filterArr.length > 0
      ? supabase.from('games')
          .select('bgg_id, name, image_url, bgg_rating, year_published')
          .neq('bgg_id', bggId)
          .not('bgg_rank', 'is', null)
          .not('bgg_rating', 'is', null)
          .overlaps(filterCol, filterArr)
          .order('bgg_rating', { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [] }),
  ]);

  const expansions = (expansionsResult.data ?? []) as any[];
  const similarGames = (similarResult.data ?? []) as any[];

  return (
    <>
      {/* Juegos similares */}
      {similarGames.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <p className="t-label" style={{ marginBottom: 16 }}>También te puede gustar</p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {similarGames.map((sg: any, i: number) => (
              <Link key={sg.bgg_id} href={`/juegos/${sg.bgg_id}`} className="hover-ghost" style={{
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0',
                borderBottom: i < similarGames.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                {sg.image_url
                  ? <Image src={sg.image_url} alt={sg.name} width={52} height={52} style={{ borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 52, height: 52, borderRadius: 10, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>🎲</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="t-card-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sg.name}</p>
                  {sg.bgg_rating && (
                    <p className="t-meta" style={{ color: sg.bgg_rating >= 8 ? 'var(--brand)' : 'var(--text-4)' }}>★ {sg.bgg_rating.toFixed(1)}</p>
                  )}
                </div>
                <span style={{ color: 'var(--text-4)', fontSize: 18 }}>›</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Expansiones del juego base */}
      {expansions.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <p className="t-label" style={{ marginBottom: 16 }}>
            Expansiones ({expansions.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {expansions.map((exp: any, i: number) => (
              <Link key={exp.bgg_id} href={`/juegos/${exp.bgg_id}`} className="hover-ghost" style={{
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0',
                borderBottom: i < expansions.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                {exp.image_url
                  ? <Image src={exp.image_url} alt={exp.name} width={52} height={52} style={{ borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 52, height: 52, borderRadius: 10, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>🧩</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="t-card-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.name}</p>
                  {exp.year_published && (
                    <p className="t-meta">{exp.year_published}</p>
                  )}
                </div>
                <span style={{ color: 'var(--text-4)', fontSize: 18, flexShrink: 0 }}>›</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
