import Link from 'next/link';
import Image from 'next/image';

export function SidebarUserAvatar({
  profileName,
  avatarUrl,
}: {
  profileName?: string | null;
  avatarUrl?: string | null;
}) {
  const initial = (profileName ?? '?')[0].toUpperCase();

  return (
    <Link
      href="/perfil"
      prefetch={false}
      title="Tu perfil"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '7px 6px', borderRadius: 12, textDecoration: 'none', width: 66 }}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt="Tu perfil"
          width={46}
          height={46}
          style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17, fontWeight: 800, color: 'white',
          background: 'linear-gradient(135deg, #89BA86, #3E5E3B)',
        }}>
          {initial}
        </div>
      )}
      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-4)', textAlign: 'center', letterSpacing: '0.03em', lineHeight: 1.2 }}>
        Tu perfil
      </span>
    </Link>
  );
}
