# Ludum — Recomendador y tracker de juegos de mesa

Aplicación web en español para descubrir juegos de mesa, organizar grupos y registrar partidas. El recomendador combina preferencias y datos del catálogo de BoardGameGeek (BGG); el tracker conserva partidas, resultados y estadísticas por grupo.

## Stack y estado actual

- **Aplicación:** Next.js 16 (App Router), React 19, TypeScript 6 y Tailwind CSS 4.
- **Backend:** Supabase (Postgres, Auth, Storage y Row Level Security).
- **Despliegue:** Vercel.
- **Catálogo:** importación CSV y sincronización programada con BGG.
- **Flujos disponibles:** autenticación, grupos, recomendador, partidas e historial, comunidades, eventos, organizaciones, torneos, colección y blog.

## Configuración Inicial

### Requisitos

- Node.js 20.9+
- npm o pnpm
- Cuenta en Supabase
- Proyecto en Vercel (opcional)

### 1. Clonar/Descargar el Proyecto

```bash
cd ~/Desktop/ludum
```

### 2. Variables de entorno

Configura `.env.local` siguiendo [SETUP.md](SETUP.md). Las variables principales de Supabase son:

- `NEXT_PUBLIC_SUPABASE_URL`: Tu URL de proyecto
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Tu clave anónima
- `SUPABASE_SERVICE_ROLE_KEY`: Tu clave de service role (solo servidor)

### 3. Crear la Base de Datos

Copia y ejecuta el contenido de `supabase_schema.sql` en el SQL Editor de Supabase:

```
https://app.supabase.com/project/[your-project]/sql/new
```

Selecciona todo el contenido de `supabase_schema.sql` y ejecútalo.

### 4. Instalar Dependencias

```bash
npm install
```

### 5. Importar Datos desde CSV

#### Descargar CSV de BoardGameGeek

1. Ve a https://boardgamegeek.com/
2. Inicia sesión
3. Ve a tu perfil > Mi Colección > Exportar Colección (CSV)

#### Ejecutar el Script de Importación

```bash
npm run import-csv /ruta/a/tu/bgg_collection.csv
```

El script procesará el CSV y poblará la base de datos con:
- Juegos (games)
- Mecánicas (mechanics)
- Categorías (categories)
- Relaciones (game_mechanics, game_categories)

### 6. Iniciar Desarrollo

```bash
npm run dev
```

La app estará disponible en `http://localhost:3000`.

## Estructura del proyecto

```
ludum/
├── app/
│   ├── api/                 # Sincronización BGG y caché del recomendador
│   ├── auth/                # Login, registro y recuperación
│   ├── grupos/              # Grupos y partidas
│   ├── juegos/              # Fichas públicas de juegos
│   ├── recomendador/
│   └── ...                  # Comunidades, eventos, blog y torneos
├── components/
├── lib/
│   ├── recommender.ts
│   └── supabase/
├── scripts/                 # Importación y medición agregada de retención
├── migrations/
└── supabase_schema.sql
```

## Formato del CSV de BGG

El script espera un CSV con las siguientes columnas:

```
id, name, yearpublished, minplayers, maxplayers, minplaytime, maxplaytime, 
weight, rating, rank, thumbnail, mechanics, categories
```

Si tu CSV tiene columnas diferentes, edita `scripts/import-csv.ts` para ajustar el mapeo.

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm start` | Inicia el servidor de producción |
| `npm run lint` | Ejecuta ESLint |
| `npm run typecheck` | Comprueba los tipos con TypeScript |
| `npm test` | Ejecuta tests unitarios locales sin llamadas a servicios externos |
| `npm run measure-retention` | Calcula cohortes agregadas de grupos (solo lectura) |
| `npm run import-csv` | Importa datos desde CSV |

Antes de integrar cambios, ejecuta `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`.

GitHub Actions ejecuta lint, typecheck y tests en cada PR. El build corre en push y ejecución manual, y requiere configurar en los GitHub Actions secrets `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.

## Notas Importantes

### Powered by BGG

Aunque usemos CSV para la importación inicial, debemos mostrar el logo "Powered by BoardGameGeek" enlazando a `https://boardgamegeek.com` en las páginas públicas.

### Sincronización con BGG

El endpoint `/api/sync-bgg` exige `CRON_SECRET` en una cabecera (`Authorization: Bearer` o `x-cron-secret`), admite los modos `ranked`, `new` y `all`, y limita `batch` a enteros entre 1 y 200. No envíes el secreto en la URL ni llames a BGG desde el cliente.

`vercel.json` es el scheduler automático. El workflow `BGG Sync` de GitHub queda solo para ejecución manual; ambos métodos requieren `CRON_SECRET` en cabecera. La ejecución programada en producción no se ha probado desde este entorno; confirma que `CRON_SECRET` está configurado en Vercel.

### RLS (Row Level Security)

Las policies de RLS están configuradas en `supabase_schema.sql`:
- Usuarios solo pueden ver/modificar su propio perfil
- Miembros de grupo pueden ver detalles del grupo
- Las tablas de juegos están públicas (lectura)
- Los datos de partidas están restringidos a miembros del grupo
- El ranking del tracker usa `SECURITY INVOKER` y solo agrega resultados visibles por las policies de grupo

## Contacto / Soporte

Para reportar bugs o sugerencias, abre un issue en el repositorio.
