'use server';

import { getSearchTaxonomyOptions } from '@/lib/cached-queries';

// Datos públicos y cacheados: se piden solo cuando el usuario abre un filtro.
export async function loadSearchTaxonomyOptions() {
  return getSearchTaxonomyOptions();
}
