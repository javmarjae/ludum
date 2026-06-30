'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Props {
  /** Archivo original elegido por el usuario. */
  file: File;
  /** Ancho del recorte exportado en px. La altura se deriva de `aspect`. Por defecto 512. */
  outputSize?: number;
  /** Relación de aspecto del recorte (ancho/alto). 1 = cuadrado, 16/9 = banner. Por defecto 1. */
  aspect?: number;
  /** Muestra una máscara circular (solo tiene sentido con aspect=1). Por defecto true. */
  circular?: boolean;
  /** Nombre del archivo exportado. */
  outputFileName?: string;
  /** Título del modal. */
  title?: string;
  onCancel: () => void;
  /** Devuelve el archivo ya recortado/transformado, listo para subir. */
  onConfirm: (file: File) => void;
}

const VIEWPORT = 288; // ancho lógico del área de recorte en px
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

type Point = { x: number; y: number };

/**
 * Editor de imagen previo a la subida: zoom, rotación (±90°) y reencuadre
 * (arrastrar / pinch) sobre un recorte de relación de aspecto configurable.
 * Exporta un File WebP a resolución fija. WYSIWYG: el mismo cálculo de transform
 * dibuja el preview y el canvas de exportación, así que lo que se ve es lo que se sube.
 */
export function ImageEditor({
  file,
  outputSize = 512,
  aspect = 1,
  circular = true,
  outputFileName = 'image.webp',
  title = 'Ajusta tu foto',
  onCancel,
  onConfirm,
}: Props) {
  const isCircular = circular && aspect === 1;
  const VW = VIEWPORT;
  const VH = Math.round(VIEWPORT / aspect);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // grados, múltiplos de 90
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });

  // Punteros activos (pan con 1 dedo, pinch-zoom con 2)
  const pointers = useRef<Map<number, Point>>(new Map());
  const pinchDist = useRef<number | null>(null);
  const lastPan = useRef<Point | null>(null);

  // ── Cargar imagen ──────────────────────────────────────────────────────────
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { imgRef.current = img; setReady(true); };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // ── Dibujo (compartido entre preview y export) ───────────────────────────────
  const paint = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, off: Point, z: number, rot: number, dpr: number) => {
      const img = imgRef.current;
      if (!img) return;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);
      // Fondo (por si la imagen no cubre tras rotar con poco zoom)
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      const base = Math.max(w / iw, h / ih); // "cover" del recorte
      const s = base * z;
      ctx.translate(w / 2 + off.x, h / 2 + off.y);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.scale(s, s);
      ctx.drawImage(img, -iw / 2, -ih / 2);
      ctx.restore();
    },
    []
  );

  // ── Render del preview en cada cambio ────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = VW * dpr;
    canvas.height = VH * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) paint(ctx, VW, VH, offset, zoom, rotation, dpr);
  }, [ready, offset, zoom, rotation, paint, VW, VH]);

  // ── Gestos ───────────────────────────────────────────────────────────────────
  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) lastPan.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];

    if (pts.length >= 2) {
      // Pinch-zoom
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinchDist.current != null) {
        const ratio = dist / pinchDist.current;
        setZoom((z) => clamp(z * ratio, MIN_ZOOM, MAX_ZOOM));
      }
      pinchDist.current = dist;
      lastPan.current = null;
    } else if (lastPan.current) {
      // Pan
      const dx = e.clientX - lastPan.current.x;
      const dy = e.clientY - lastPan.current.y;
      lastPan.current = { x: e.clientX, y: e.clientY };
      setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDist.current = null;
    if (pointers.current.size === 1) {
      const p = [...pointers.current.values()][0];
      lastPan.current = { x: p.x, y: p.y };
    } else if (pointers.current.size === 0) {
      lastPan.current = null;
    }
  }

  function onWheel(e: React.WheelEvent) {
    setZoom((z) => clamp(z * (e.deltaY < 0 ? 1.08 : 0.92), MIN_ZOOM, MAX_ZOOM));
  }

  function rotate(dir: -1 | 1) {
    setRotation((r) => (r + dir * 90 + 360) % 360);
  }

  function reset() {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  }

  // ── Exportar ─────────────────────────────────────────────────────────────────
  async function confirm() {
    const img = imgRef.current;
    if (!img) return;
    setExporting(true);
    const outW = outputSize;
    const outH = Math.round(outputSize / aspect);
    const out = document.createElement('canvas');
    out.width = outW;
    out.height = outH;
    const ctx = out.getContext('2d');
    if (!ctx) { setExporting(false); return; }
    const k = outputSize / VW; // mismo factor para x e y (recorte escalado uniformemente)
    paint(ctx, outW, outH, { x: offset.x * k, y: offset.y * k }, zoom, rotation, 1);

    const blob: Blob | null = await new Promise((res) =>
      out.toBlob((b) => res(b), 'image/webp', 0.9)
    );
    setExporting(false);
    if (!blob) { onCancel(); return; }
    const edited = new File([blob], outputFileName, { type: 'image/webp' });
    onConfirm(edited);
  }

  const ctrlBtn: React.CSSProperties = {
    width: 40, height: 40, borderRadius: 10, border: '1px solid var(--border)',
    background: 'var(--bg-card)', color: 'var(--text-2)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'rgba(0,0,0,0.55)', padding: 16,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div style={{ width: '100%', maxWidth: VW + 48, background: 'var(--bg-card)', borderRadius: 18, padding: 20, boxShadow: 'var(--shadow-card-hover)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{title}</h3>
          <button onClick={onCancel} aria-label="Cerrar" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-4)', lineHeight: 1 }}>✕</button>
        </div>

        {/* Área de recorte */}
        <div
          style={{ position: 'relative', width: VW, height: VH, margin: '0 auto', borderRadius: 12, overflow: 'hidden', touchAction: 'none', cursor: 'grab', background: '#000' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          <canvas ref={canvasRef} style={{ width: VW, height: VH, display: 'block' }} />
          {/* Máscara: círculo para avatares; marco fino para recortes rectangulares. */}
          {isCircular ? (
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)', border: '2px solid rgba(255,255,255,0.7)', pointerEvents: 'none' }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(255,255,255,0.45)', borderRadius: 12, pointerEvents: 'none' }} />
          )}
          {!ready && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 600 }}>Cargando…</div>
          )}
        </div>

        {/* Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <span aria-hidden style={{ fontSize: 13, color: 'var(--text-4)' }}>−</span>
          <input
            type="range" min={MIN_ZOOM} max={MAX_ZOOM} step={0.01} value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            aria-label="Zoom"
            style={{ flex: 1, accentColor: 'var(--brand)' }}
          />
          <span aria-hidden style={{ fontSize: 16, color: 'var(--text-4)' }}>+</span>
        </div>

        {/* Acciones de transformación */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12 }}>
          <button type="button" onClick={() => rotate(-1)} title="Girar a la izquierda" style={ctrlBtn}>
            <RotateSvg dir="left" />
          </button>
          <button type="button" onClick={() => rotate(1)} title="Girar a la derecha" style={ctrlBtn}>
            <RotateSvg dir="right" />
          </button>
          <button type="button" onClick={reset} title="Restablecer" style={{ ...ctrlBtn, width: 'auto', padding: '0 14px', fontSize: 12, fontWeight: 700 }}>
            Restablecer
          </button>
        </div>

        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)', textAlign: 'center', marginTop: 10 }}>
          Arrastra para reencuadrar · rueda o pellizca para acercar
        </p>

        {/* Confirmar / cancelar */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            type="button" onClick={confirm} disabled={!ready || exporting}
            style={{ flex: 1, padding: '12px', borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: !ready || exporting ? 'default' : 'pointer', fontFamily: 'inherit', color: 'white', background: 'var(--brand)', border: 'none', opacity: !ready || exporting ? 0.7 : 1 }}
          >
            {exporting ? 'Procesando…' : 'Usar foto'}
          </button>
          <button
            type="button" onClick={onCancel}
            style={{ padding: '12px 20px', borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: 'var(--bg-inset)', border: 'none', color: 'var(--text-2)' }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function RotateSvg({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === 'left' ? 'scaleX(-1)' : undefined }}>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}
