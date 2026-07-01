import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

/**
 * Deduplica la llamada a auth.getUser() dentro del mismo request.
 * React cache() asegura que layout y page comparten el mismo resultado
 * sin hacer dos llamadas de red al servicio de autenticación.
 *
 * Usar para cualquier decisión de autorización real (gating de páginas
 * privadas, permisos de admin, server actions que escriben datos).
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

/**
 * Variante ligera: lee la sesión de la cookie (JWT ya verificado por
 * firma/expiración) sin round-trip de red al servicio de auth de Supabase.
 *
 * Úsala SOLO para decidir qué interfaz pintar (shell con sidebar vs. nav
 * pública, landing vs. dashboard) donde el coste de una revalidación de
 * red en cada carga de página no está justificado. No la uses para
 * autorizar acciones ni datos sensibles: cualquier query real sigue
 * protegida por RLS con el JWT de la cookie, que Supabase valida de
 * nuevo en el servidor independientemente de esto.
 */
export const getAuthUserLite = cache(async () => {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
});
