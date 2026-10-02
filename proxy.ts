import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { safeNext } from '@/lib/safe-next';

const PROTECTED_ROUTES = [
  /^\/(grupos|dashboard|perfil|eventos|partidas|mensajes|notificaciones|admin)(\/|$)/,
  /^\/recomendador\/?$/,
  /^\/blog\/nueva\/?$/,
  /^\/comunidades\/.+/,
  /^\/organizaciones\/nueva\/?$/,
  /^\/torneos\/(nuevo|[^/]+\/admin)\/?$/,
];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getSession lee la cookie y verifica el JWT localmente; solo va a la red
  // (refresh) cuando el access token ha expirado. getUser() aquí costaba un
  // round-trip a Supabase Auth en CADA página y CADA prefetch RSC — era el
  // mayor contribuidor al TTFB de todo el sitio. La autorización real sigue
  // en cada página/RLS; el proxy solo decide redirecciones de UI.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // Redirigir aquí evita que, con prerenderizado parcial, se envíe el shell antes de la redirección de la página.
  const isProtected = PROTECTED_ROUTES.some((re) => re.test(request.nextUrl.pathname));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const { pathname } = request.nextUrl;
  if (user && (pathname === '/auth/login' || pathname === '/auth/signup')) {
    const target = new URL(safeNext(request.nextUrl.searchParams.get('next')), request.url);
    return NextResponse.redirect(target);
  }

  // La landing de "/" es estática para visitantes; con sesión se sirve el dashboard.
  if (!user && pathname === '/inicio') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  if (user && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/inicio';
    const rewrite = NextResponse.rewrite(url, { request });
    supabaseResponse.cookies.getAll().forEach((cookie) => rewrite.cookies.set(cookie));
    return rewrite;
  }

  return supabaseResponse;
}

export const config = {
  // Se ejecuta en páginas reales (para refrescar la sesión de Supabase y proteger
  // rutas), pero NO en /api (cada ruta autentica por su cuenta → evita un getUser
  // de red redundante por hit) ni en estáticos/metadata. Reduce llamadas al
  // servicio de Auth bajo carga sin romper el refresco de sesión en navegación.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
