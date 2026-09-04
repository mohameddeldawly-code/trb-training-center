import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Loader2, Maximize2, Minus, Plus, RotateCw } from 'lucide-react';

/**
 * عارض PDF داخلي مبني على PDF.js (مكتبة مجانية مفتوحة المصدر).
 * تُحمَّل المكتبة عند فتح الكتاب فقط (dynamic import) حتى لا تثقل باقي الموقع.
 * يعمل على الموبايل والتابلت والكمبيوتر والشاشة التفاعلية.
 */
export function PdfViewer({ url, title, allowDownload }: { url: string; title: string; allowDownload?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const docRef    = useRef<any>(null);
  const renderRef = useRef<any>(null);

  const [page, setPage]   = useState(1);
  const [pages, setPages] = useState(0);
  const [zoom, setZoom]   = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // تحميل المستند
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const pdfjs = await import('pdfjs-dist');
        // عامل الخلفية يُحمَّل من نفس حزمة المكتبة — بلا أي خدمة خارجية
        const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        const task = pdfjs.getDocument({ url, cMapPacked: true });
        const doc = await task.promise;
        if (cancelled) return;
        docRef.current = doc;
        setPages(doc.numPages);
        setPage(1);
      } catch (e) {
        if (!cancelled) setError('تعذّر فتح ملف الكتاب. تأكد من صحة الرابط أو حاول تحميله مباشرةً.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; docRef.current?.destroy?.(); };
  }, [url]);

  // رسم الصفحة الحالية
  useEffect(() => {
    const doc = docRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas || !pages) return;
    let cancelled = false;

    (async () => {
      try {
        const p = await doc.getPage(page);
        if (cancelled) return;
        const containerWidth = wrapRef.current?.clientWidth ?? 800;
        const base = p.getViewport({ scale: 1, rotation });
        const fit = Math.min(containerWidth / base.width, 2.2);
        const viewport = p.getViewport({ scale: fit * zoom, rotation });
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width  = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width  = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderRef.current?.cancel?.();
        renderRef.current = p.render({ canvasContext: ctx, viewport });
        await renderRef.current.promise;
      } catch { /* تجاهُل إلغاء الرسم عند تغيير الصفحة بسرعة */ }
    })();

    return () => { cancelled = true; };
  }, [page, zoom, rotation, pages]);

  // التنقل بلوحة المفاتيح
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  setPage((p) => Math.min(p + 1, pages));
      if (e.key === 'ArrowRight') setPage((p) => Math.max(p - 1, 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pages]);

  const fullscreen = () => {
    const el = wrapRef.current?.parentElement;
    if (!document.fullscreenElement) void el?.requestFullscreen?.();
    else void document.exitFullscreen();
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-ember-200 bg-ember-50 p-8 text-center">
        <p className="text-[15px] font-semibold text-ember-800">{error}</p>
        <a href={url} target="_blank" rel="noopener noreferrer"
           className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-navy-700 px-5 text-sm font-semibold text-white">
          <Download className="h-4 w-4" aria-hidden /> فتح الملف في نافذة جديدة
        </a>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-steel-200 bg-white">
      {/* شريط الأدوات */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-steel-200 bg-steel-50 px-3 py-2.5">
        <div className="flex items-center gap-1">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} aria-label="الصفحة السابقة"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-steel-300 bg-white text-navy-700 disabled:opacity-40">
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
          <span className="px-2 text-[13.5px] font-semibold text-navy-800" aria-live="polite">
            {loading ? '…' : `${page} / ${pages}`}
          </span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages} aria-label="الصفحة التالية"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-steel-300 bg-white text-navy-700 disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))} aria-label="تصغير"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-steel-300 bg-white text-navy-700">
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <span className="w-14 text-center text-[13px] font-semibold text-steel-600">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)))} aria-label="تكبير"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-steel-300 bg-white text-navy-700">
            <Plus className="h-4 w-4" aria-hidden />
          </button>
          <button onClick={() => setRotation((r) => (r + 90) % 360)} aria-label="تدوير الصفحة"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-steel-300 bg-white text-navy-700">
            <RotateCw className="h-4 w-4" aria-hidden />
          </button>
          <button onClick={fullscreen} aria-label="ملء الشاشة"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-steel-300 bg-white text-navy-700">
            <Maximize2 className="h-4 w-4" aria-hidden />
          </button>
          {allowDownload && (
            <a href={url} download target="_blank" rel="noopener noreferrer"
               className="flex h-9 items-center gap-1.5 rounded-lg bg-navy-700 px-3 text-[13px] font-semibold text-white">
              <Download className="h-4 w-4" aria-hidden /> تحميل
            </a>
          )}
        </div>
      </div>

      {/* منطقة العرض */}
      <div ref={wrapRef} className="relative max-h-[78vh] min-h-[420px] overflow-auto bg-steel-100 p-3 sm:p-5">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-steel-100/90" role="status">
            <Loader2 className="h-7 w-7 animate-spin text-navy-600" aria-hidden />
            <p className="text-sm text-steel-600">جارٍ فتح الكتاب…</p>
          </div>
        )}
        <canvas ref={canvasRef} className="mx-auto block rounded-lg bg-white shadow-card" aria-label={title} />
      </div>
    </div>
  );
}
