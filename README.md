# Ludum - Recomendador y Tracker de Juegos de Mesa

Web en español que combina un recomendador de juegos de mesa según preferencias + tracker de partidas por grupo.

## Stack Técnico

- **Frontend**: Next.js 14+ (App Router, TypeScript, Tailwind CSS)
- **Backend/DB**: Supabase (Postgres, Auth)
- **Hosting**: Vercel
- **Datos**: CSV importado desde BoardGameGeek
- **Monetización**: Google AdSense

## Fases de Desarrollo

1. **Fase 0**: Preparación (registrar app en BGG) ✅ *Saltado - usando CSV*
2. **Fase 1**: Infraestructura (setup + script de importación) 🚀 *En progreso*
3. **Fase 2**: Recomendador (cuestionario + matching)
4. **Fase 3**: Cuentas y grupos
5. **Fase 4**: Tracker de partidas
6. **Fase 5**: Lanzamiento (SEO + AdSense)

## Configuración Inicial

### Requisitos

- Node.js 18+
- npm o pnpm
- Cuenta en Supabase
- Proyecto en Vercel (opcional)

### 1. Clonar/Descargar el Proyecto

```bash
cd ~/Desktop/ludum
```

### 2. Variables de Entorno

Copia el archivo de ejemplo y rellena tus credenciales:

```bash
cp .env.local.example .env.local
```

Obtén tus credenciales de Supabase:

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

## Estructura del Proyecto

```
ludum/
├── app/
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx            # Página de inicio
│   └── globals.css         # Estilos globales
├── lib/
│   └── supabase.ts         # Cliente Supabase
├── scripts/
│   └── import-csv.ts       # Script para importar CSV
├── public/                 # Archivos estáticos
├── supabase_schema.sql     # Schema de BD
├── next.config.js          # Config de Next.js
├── tailwind.config.js      # Config de Tailwind
├── tsconfig.json           # Config de TypeScript
└── .env.local              # Variables de entorno (no commitear)
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
| `npm run import-csv` | Importa datos desde CSV |

## Próximos Pasos

1. ✅ Setup del proyecto
2. ✅ Crear schema de BD
3. ✅ Script de importación CSV
4. ⬜ Implementar recomendador (Fase 2)
5. ⬜ Implementar autenticación (Fase 3)
6. ⬜ Implementar tracker (Fase 4)
7. ⬜ SEO + AdSense (Fase 5)

## Notas Importantes

### Powered by BGG

Aunque usemos CSV para la importación inicial, debemos mostrar el logo "Powered by BoardGameGeek" enlazando a `https://boardgamegeek.com` en las páginas públicas.

### Rate Limiting (futuro)

Si en el futuro sincronizamos directamente con la API de BGG:
- No hacer más de ~2 req/seg
- Cachear agresivamente
- Hacer sincronizaciones batch (cron mensual)
- Nunca llamar a BGG desde el cliente

### RLS (Row Level Security)

Las policies de RLS están configuradas en `supabase_schema.sql`:
- Usuarios solo pueden ver/modificar su propio perfil
- Miembros de grupo pueden ver detalles del grupo
- Las tablas de juegos están públicas (lectura)
- Los datos de partidas están restringidos a miembros del grupo

## Contacto / Soporte

Para reportar bugs o sugerencias, abre un issue en el repositorio.
