import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, FileEdit, Printer } from "lucide-react";
import PrintDocumentView from "@/components/print/PrintDocumentView";
import { apiGet } from "@/lib/api";
import { downloadBaPdf } from "@/lib/baPdf";
import type { Layanan } from "@/lib/types";

type CopyMode = "both" | "1" | "2";

export default function Cetak() {
  const { id } = useParams<{ id: string }>();
  const [layanan, setLayanan] = useState<Layanan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copyMode, setCopyMode] = useState<CopyMode>("both");

  const loadLayanan = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const data = await apiGet<Layanan>(`/layanan/${id}`);
      setLayanan(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadLayanan();
  }, [loadLayanan]);

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-100 text-sm text-slate-500">
        Memuat dokumen Berita Acara…
      </div>
    );
  }

  if (error || !layanan) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-100 p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
          Dokumen tidak dapat ditemukan.{" "}
          <Link to="/" className="font-semibold text-blue-600 hover:underline">
            Kembali ke dashboard
          </Link>
          .
        </div>
      </div>
    );
  }

  if (!layanan.ba) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
          <p className="font-heading text-base font-bold text-slate-900">Berita Acara belum dibuat</p>
          <p className="mt-1.5 leading-relaxed">
            Layanan <span className="font-mono text-xs font-semibold">{layanan.no_layanan}</span> atas nama{" "}
            <span className="font-medium text-slate-800">{layanan.pemohon}</span> belum memiliki naskah Berita Acara.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <Link
              to={`/buat-ba/${layanan.id}`}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-xs font-medium text-white hover:bg-blue-700"
            >
              Buat Berita Acara
            </Link>
            <Link
              to="/"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Kembali
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-slate-100 pb-12 print:bg-white print:pb-0">
      {/* Toolbar (hidden when printing) */}
      <div className="sticky top-0 z-20 mb-8 border-b border-slate-200 bg-white/95 backdrop-blur-xs print:hidden">
        <div className="mx-auto flex max-w-[900px] flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/"
              aria-label="Kembali ke dashboard"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate font-heading text-base font-bold text-slate-900 sm:text-lg">
                Cetak Berita Acara — 2 Salinan
              </h1>
              <p className="truncate font-mono text-xs text-slate-500">
                {layanan.no_layanan} · {layanan.pemohon}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
              {(
                [
                  { key: "both", label: "2 Salinan" },
                  { key: "1", label: "Salinan 1" },
                  { key: "2", label: "Salinan 2" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setCopyMode(opt.key)}
                  className={`h-8 rounded-md px-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    copyMode === opt.key ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <Link
              to={`/buat-ba/${layanan.id}`}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <FileEdit className="size-3.5" />
              <span>Edit BA</span>
            </Link>

            <button
              type="button"
              onClick={() => layanan.ba && downloadBaPdf(layanan.ba)}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <Download className="size-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
            >
              <Printer className="size-4" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[840px] px-4 print:max-w-none print:px-0">
        {(copyMode === "both" || copyMode === "1") && (
          <PrintDocumentView value={layanan.ba} copy={1} hasNextPage={copyMode === "both"} />
        )}
        {(copyMode === "both" || copyMode === "2") && (
          <PrintDocumentView value={layanan.ba} copy={2} hasNextPage={false} />
        )}
      </div>
    </div>
  );
}
