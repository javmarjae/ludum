'use client';

import { useLayoutEffect } from 'react';

// Corrige el data-authed que el script inicial deduce de la cookie si la sesión real no coincide.
export function AuthFlag({ authed }: { authed: boolean }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (authed) root.setAttribute('data-authed', 'true');
    else root.removeAttribute('data-authed');
  }, [authed]);
  return null;
}
