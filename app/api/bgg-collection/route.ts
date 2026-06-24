import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')?.trim();
  if (!username) return NextResponse.json({ error: 'Username requerido' }, { status: 400 });

  const url = `https://boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(username)}&own=1&excludesubtype=boardgameexpansion&stats=0`;

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });

    // BGG devuelve 202 cuando la colección está siendo procesada — hay que reintentar
    if (res.status === 202) {
      return NextResponse.json({ retry: true }, { status: 202 });
    }

    if (!res.ok) {
      return NextResponse.json({ error: 'Usuario no encontrado en BGG' }, { status: 404 });
    }

    const xml = await res.text();

    // Extraer bgg_ids de los items
    const bggIds: number[] = [];
    const matches = xml.matchAll(/objectid="(\d+)"/g);
    for (const m of matches) {
      bggIds.push(parseInt(m[1]));
    }

    if (bggIds.length === 0) {
      // Check for error message in XML
      if (xml.includes('Invalid username')) {
        return NextResponse.json({ error: 'Usuario no encontrado en BGG' }, { status: 404 });
      }
      return NextResponse.json({ bggIds: [] });
    }

    return NextResponse.json({ bggIds });
  } catch {
    return NextResponse.json({ error: 'Error al conectar con BGG' }, { status: 500 });
  }
}
