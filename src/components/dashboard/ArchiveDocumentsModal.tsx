import { useEffect, useState } from "react";
import { ArrowLeft, Download, Eye, FileText, FolderOpen, X } from "lucide-react";
import { apiGet } from "@/lib/api";
import { getDokumenSlots } from "@/lib/dokumen";
import { formatUkuran, formatWaktu } from "@/lib/format";
import type { Dokumen, Layanan } from "@/lib/types";

interface ArchiveDocumentsModalProps {
  layanan: Layanan | null;
  onClose: () => void;
}

export default function ArchiveDocumentsModal({ layanan, onClose }: ArchiveDocumentsModalProps) {
  const [files, setFiles] = useState<Dokumen[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Dokumen | null>(null);

  useEffect(() => {
    if (!layanan) {
      setFiles([]);
      setPreviewDoc(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
    setPreviewDoc(null);

    apiGet<Dokumen[]>(`/layanan/${layanan.id}/dokumen`)
      .then((list) => {
        if (!cancelled) setFiles(list);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [layanan]);

  if (!layanan) return null;

  const adaSuratKuasa = Boolean(layanan.ba?.ada_surat_kuasa ?? layanan.ada_surat_kuasa);
  const slots = getDokumenSlots(adaSuratKuasa);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative z-10 flex max-h-[90svh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex items-start gap-3 min-w-0">
            {previewDoc && (
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                aria-label="Kembali ke daftar dokumen"
                className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <ArrowLeft className="size-4" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="truncate font-heading text-base font-bold text-slate-900">
                {previewDoc ? previewDoc.filename : "Dokumen Hasil Upload"}
              </h2>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {previewDoc ? (
                  <span className="tabular-nums">
                    {formatUkuran(previewDoc.size)} · Diunggah {formatWaktu(previewDoc.uploaded_at)}
                  </span>
                ) : (
                  <>
                    <span className="font-mono font-semibold text-slate-700">{layanan.no_layanan}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{layanan.pemohon}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="tabular-nums">{files.length} berkas tersimpan</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {previewDoc && (
              <a
                href={`/api/dokumen/${previewDoc.id}/unduh`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="size-3.5" />
                <span>Unduh</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup modal dokumen"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {previewDoc ? (
            <div className="rounded-lg bg-slate-100 p-4">
              {previewDoc.mime_type.startsWith("image/") ? (
                <img
                  src={`/api/dokumen/${previewDoc.id}/unduh?inline=1`}
                  alt={previewDoc.filename}
                  className="mx-auto max-h-[65svh] rounded-lg object-contain shadow"
                />
              ) : previewDoc.mime_type === "application/pdf" ? (
                <iframe
                  title={previewDoc.filename}
                  src={`/api/dokumen/${previewDoc.id}/unduh?inline=1`}
                  className="h-[65svh] w-full rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <div className="py-16 text-center text-sm text-slate-600">
                  Pratinjau langsung tidak tersedia untuk format berkas ini. Klik tombol Unduh di atas untuk membukanya.
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-16 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-6 text-center text-sm text-red-700">
              Dokumen arsip tidak dapat dimuat saat ini. Tutup dan coba buka kembali.
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
              <FolderOpen className="size-8 text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-900">Belum ada dokumen yang diunggah</p>
              <p className="mt-1 text-xs text-slate-500">
                Tidak ada berkas unggahan yang tercatat pada arsip layanan ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {slots.map((slot) => {
                const slotFiles = files.filter((f) => f.jenis === slot.key);
                if (slotFiles.length === 0) return null;

                return (
                  <div key={slot.key} className="rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
                      <span className="text-xs font-semibold text-slate-800">{slot.label}</span>
                      <span className="text-[11px] font-medium text-slate-500 tabular-nums">
                        {slotFiles.length} berkas
                      </span>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {slotFiles.map((doc) => (
                        <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <FileText className="size-4 shrink-0 text-blue-600" />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-slate-900">{doc.filename}</p>
                              <p className="text-[11px] text-slate-500 tabular-nums">
                                {formatUkuran(doc.size)} · {formatWaktu(doc.uploaded_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <Eye className="size-3.5" />
                              <span>Lihat</span>
                            </button>
                            <a
                              href={`/api/dokumen/${doc.id}/unduh`}
                              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <Download className="size-3.5" />
                              <span>Unduh</span>
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
