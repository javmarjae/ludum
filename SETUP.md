# Setup Completo de Ludum

## 1. Crear Proyecto en Supabase

1. Ve a https://supabase.com
2. Crea una nueva cuenta o inicia sesión
3. Crea un nuevo proyecto (elige región cercana)
4. Guarda tu contraseña de BD (la necesitarás después)
5. Espera a que el proyecto se inicialice (~2 min)

## 2. Obtener Credenciales

Una vez el proyecto esté listo:

1. Abre **Settings > API** en el panel de Supabase
2. Copia estos valores a `.env.local`:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

Tu `.env.local` debe verse así:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## 3. Crear las Tablas

1. Ve a **SQL Editor** en Supabase
2. Haz click en **New Query**
3. Copia TODO el contenido de `supabase_schema.sql`
4. Pégalo en el editor
5. Haz click en **Run** (o `Ctrl+Enter`)
6. Espera a que se cree todo (tablas, índices, RLS policies)

## 4. Descargar CSV de BoardGameGeek

1. Ve a https://boardgamegeek.com
2. **Login** con tu cuenta
3. Abre tu perfil (esquina superior derecha)
4. Ve a **Collection** → **Exporting Collection**
5. Haz click en **CSV Export** y guárdalo
6. Mueve el archivo a una carpeta conocida (ej: `~/Downloads/bgg.csv`)

## 5. Importar Datos

```bash
# Desde la carpeta raíz del proyecto
npm run import-csv ~/Downloads/bgg.csv
```

Espera a que termine (puede tardar 1-5 min según número de juegos).

## 6. Iniciar Desarrollo

```bash
npm run dev
```

Abre http://localhost:3000 en el navegador.

## Verificar que Todo Funciona

1. Supabase debería tener:
   - ✅ 13 tablas creadas
   - ✅ Juegos importados (Table > games > ver filas)
   - ✅ Mecánicas creadas (Table > mechanics)

2. Next.js debería:
   - ✅ Compilar sin errores
   - ✅ Servir en http://localhost:3000
   - ✅ Mostrar la página de inicio

## Troubleshooting

### "Missing Supabase environment variables"
→ Verifica que `.env.local` existe y tiene los valores correctos

### Error al importar CSV
→ Verifica que:
- El archivo CSV existe en esa ruta
- Las columnas del CSV son correctas
- Tienes permisos de escritura en BD (service_role_key correcto)

### Tablas no creadas en Supabase
→ Revisa la pestaña **Logs** en Supabase para ver el error SQL exacto

### El servidor Next no inicia
→ Ejecuta:
```bash
npm install
npm run build
```

## Próximo Paso

Una vez verificado, puedes empezar con la Fase 2 (Recomendador).
