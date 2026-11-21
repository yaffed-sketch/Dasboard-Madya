import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarCheck,
  Camera,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  FileLock,
  FileSignature,
  FileText,
  Lock,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { apiDelete, apiGet, apiPost, apiUpload } from "@/lib/api";
import { getDokumenSlots, type DokumenSlot } from "@/lib/dokumen";
import { formatUkuran, formatWaktu } from "@/lib/format";
import type { Dokumen, DokumenJenis, Layanan } from "@/lib/types";
import { useToast } from "@/components/ui/ToastProvider";

const SLOT_ICONS: Record<DokumenJenis, typeof FileText> = {
  persetujuan_jadwal: CalendarCheck,
  surat_kuasa: FileSignature,
  daftar_hadir: ClipboardList,
  berita_acara: FileText,
  wasiat_tertutup: FileLock,
  dokumentasi: Camera,
};

interface SlotCardProps {
  slot: DokumenSlot;
  files: Dokumen[];
  uploading: boolean;
  locked: boolean;
  highlightedMissing: boolean;
  onPick: (jenis: DokumenJenis, file: File) => void;
  onDelete: (dok: Dokumen) => void;
  onPreview: (dok: Dokumen) => void;
  deletingId: string | null;
}

function SlotCard({
  slot,
  files,
  uploading,
  locked,
  highlightedMissing,
  onPick,
  onDelete,
  onPreview,
  deletingId,
}: SlotCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const Icon = SLOT_ICONS[slot.key];
  const hasFile = files.length > 0;
  const isMissingHighlight = highlightedMissing && slot.required && !hasFile;

  return (
    <div
      onDragOver={(e) => {
        if (locked) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        if (locked) return;
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onPick(slot.key, f);
      }}
      className={`flex flex-col rounded-xl border bg-white p-5 transition-colors ${
        isMissingHighlight
          ? "border-red-300 bg-red-50/30"
          : dragging
            ? "border-blue-500 bg-blue-50/40"
            : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${
            isMissingHighlight
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          <Icon className="size-4" />
        </div>
        <div className="text-right text-xs font-medium">
          {hasFile ? (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="size-3.5" />
              Terkumpul ({files.length})
            </span>
          ) : slot.required ? (
            <span className={isMissingHighlight ? "font-semibold text-red-700" : "text-amber-700"}>
              {isMissingHighlight ? "Belum Diupload (Wajib)" : "Wajib Dilengkapi"}
            </span>
          ) : (
            <span className="text-slate-400">Opsional</span>
          )}
        </div>
      </div>

      <h3 className="mt-4 font-heading text-sm font-semibold text-slate-900">{slot.label}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{slot.description}</p>

      <div className="mt-auto pt-4">
        {!locked ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={slot.accept}
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPick(slot.key, f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-xs font-medium transition-colors ${
                hasFile
                  ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              } disabled:opacity-50`}
            >
              <Upload className="size-3.5" />
              <span>{uploading ? "Mengunggah…" : hasFile ? "Tambah Berkas Lagi" : "Pilih atau Seret File"}</span>
            </button>
          </>
        ) : (
          <div className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
            <Lock className="size-3.5" />
            <span>Terkunci Permanen</span>
          </div>
        )}

        {files.length > 0 && (
          <ul className="mt-3 flex flex-col divide-y divide-slate-100 border-t border-slate-100 pt-2">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-800">{f.filename}</p>
                  <p className="text-[11px] text-slate-500 tabular-nums">
                    {formatUkuran(f.size)} · {formatWaktu(f.uploaded_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onPreview(f)}
                    title="Pratinjau"
                    className="flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Eye className="size-3.5" />
                  </button>
                  <a
                    href={`/api/dokumen/${f.id}/unduh`}
                    title="Unduh berkas"
                    className="flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Download className="size-3.5" />
                  </a>
                  {!locked && (
                    <button
                      type="button"
                      disabled={deletingId === f.id}
                      onClick={() => onDelete(f)}
                      title="Hapus berkas"
                      className="flex size-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface DocumentUploadManagerProps {
  layanan: Layanan;
  onLayananUpdated?: (updated: Layanan) => void;
}

export default function DocumentUploadManager({ layanan, onLayananUpdated }: DocumentUploadManagerProps) {
  const toast = useToast();
  const [files, setFiles] = useState<Dokumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<DokumenJenis | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Dokumen | null>(null);
  const [showMissingAlert, setShowMissingAlert] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [locking, setLocking] = useState(false);

  const adaSuratKuasa = Boolean(layanan.ba?.ada_surat_kuasa ?? layanan.ada_surat_kuasa);
  const slots = getDokumenSlots(adaSuratKuasa);
  const requiredSlots = slots.filter((s) => s.required);
  const missingSlots = requiredSlots.filter((s) => !files.some((f) => f.jenis === s.key));
  const completedRequired = requiredSlots.length - missingSlots.length;
  const pct = requiredSlots.length > 0 ? Math.round((completedRequired / requiredSlots.length) * 100) : 100;
  const isComplete = missingSlots.length === 0;
  const isLocked = Boolean(layanan.dokumen_terkunci);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const list = await apiGet<Dokumen[]>(`/layanan/${layanan.id}/dokumen`);
      setFiles(list);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [layanan.id]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    if (isComplete && showMissingAlert) {
      setShowMissingAlert(false);
    }
  }, [isComplete, showMissingAlert]);

  const handleUpload = async (jenis: DokumenJenis, file: File) => {
    if (isLocked) {
      toast.error("Dokumen sudah dikunci permanen dan tidak dapat ditambah lagi.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran berkas melebihi batas maksimum 10 MB");
      return;
    }
    setUploadingSlot(jenis);
    try {
      const fd = new FormData();
      fd.append("jenis", jenis);
      fd.append("file", file);
      const uploaded = await apiUpload<Dokumen>(`/layanan/${layanan.id}/dokumen`, fd);
      setFiles((prev) => [uploaded, ...prev]);
      toast.success(`"${file.name}" berhasil diunggah`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah dokumen");
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleDelete = async (dok: Dokumen) => {
    if (isLocked) {
      toast.error("Dokumen sudah dikunci permanen dan tidak dapat dihapus.");
      return;
    }
    setDeletingId(dok.id);
    try {
      await apiDelete<void>(`/dokumen/${dok.id}`);
      setFiles((prev) => prev.filter((item) => item.id !== dok.id));
      toast.success(`"${dok.filename}" telah dihapus`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus dokumen");
    } finally {
      setDeletingId(null);
    }
  };

  const handleClickSave = () => {
    if (isLocked || loading) return;
    if (!isComplete) {
      setShowMissingAlert(true);
      const missingNames = missingSlots.map((s) => s.label).join(", ");
      toast.error(`Simpan ditolak — dokumen wajib belum lengkap: ${missingNames}`);
      return;
    }
    setConfirmSaveOpen(true);
  };

  const handleConfirmLockSave = async () => {
    setLocking(true);
    try {
      const updated = await apiPost<Layanan>(`/layanan/${layanan.id}/dokumen/simpan`);
      onLayananUpdated?.(updated);
      window.dispatchEvent(new Event("layanan-updated"));
      setConfirmSaveOpen(false);
      toast.success("Semua dokumen disimpan permanen & layanan otomatis dipindahkan ke Riwayat & Arsip.");
    } catch (err) {
      setConfirmSaveOpen(false);
      setShowMissingAlert(true);
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan dan mengunci dokumen");
    } finally {
      setLocking(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Completeness & Save Lock Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Progres Berkas Wajib:{" "}
                  <span className="tabular-nums">
                    {completedRequired} dari {requiredSlots.length}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Total {files.length} berkas tersimpan · Status Surat Kuasa:{" "}
                  <span className="font-medium text-slate-700">
                    {adaSuratKuasa ? "Wajib Dilampirkan (Ada Surat Kuasa)" : "Opsional (Tanpa Surat Kuasa)"}
                  </span>
                </p>
              </div>
              <span
                className={`font-mono text-sm font-semibold tabular-nums ${
                  isComplete ? "text-emerald-700" : "text-blue-700"
                }`}
              >
                {pct}%
              </span>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  isComplete ? "bg-emerald-600" : "bg-blue-600"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="shrink-0">
            {isLocked ? (
              <div className="inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-xs font-semibold text-emerald-800">
                <Lock className="size-3.5" />
                <span>Dokumen Terkunci Permanen</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClickSave}
                aria-disabled={!isComplete || loading}
                className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-xs font-semibold transition-colors lg:w-auto ${
                  isComplete && !loading
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "cursor-not-allowed border border-slate-300 bg-slate-200 text-slate-500"
                }`}
              >
                <Save className="size-4" />
                <span>Simpan Dokumen</span>
              </button>
            )}
          </div>
        </div>

        {/* Inline Status / Missing Upload Notification */}
        {isLocked ? (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3.5 py-3 text-xs text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <Lock className="mt-0.5 size-4 shrink-0 text-emerald-700" />
              <div>
                <p className="font-semibold">
                  Seluruh dokumen telah disimpan permanen & layanan dipindahkan ke Riwayat & Arsip
                  {layanan.dokumen_dikunci_at ? ` (${formatWaktu(layanan.dokumen_dikunci_at)})` : ""}.
                </p>
                <p className="mt-0.5 text-emerald-800">
                  Berkas tidak dapat lagi ditambah, diubah, atau dihapus. Anda tetap dapat melihat pratinjau maupun
                  mengunduh salinan berkas.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/"
                className="inline-flex h-8 items-center justify-center rounded-md border border-emerald-300 bg-white px-3 text-xs font-medium text-emerald-900 hover:bg-emerald-50 whitespace-nowrap"
              >
                Daftar Layanan
              </Link>
              <Link
                to="/history"
                className="inline-flex h-8 items-center justify-center rounded-md bg-emerald-700 px-3 text-xs font-medium text-white hover:bg-emerald-800 whitespace-nowrap"
              >
                Lihat Riwayat & Arsip
              </Link>
            </div>
          </div>
        ) : !isComplete ? (
          <div
            role={showMissingAlert ? "alert" : "status"}
            className={`mt-4 flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs ${
              showMissingAlert
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-amber-200 bg-amber-50/70 text-amber-900"
            }`}
          >
            <AlertTriangle
              className={`mt-0.5 size-4 shrink-0 ${showMissingAlert ? "text-red-600" : "text-amber-600"}`}
            />
            <div>
              <p className="font-semibold">
                {showMissingAlert
                  ? "Simpan Dokumen Ditolak — Unggahan Belum Lengkap"
                  : "Notifikasi Kelengkapan: Tombol Simpan Dokumen belum aktif"}
              </p>
              <p className="mt-0.5">
                Harap unggah seluruh dokumen wajib terlebih dahulu:{" "}
                <span className="font-semibold">{missingSlots.map((s) => s.label).join(", ")}</span>.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-xs text-emerald-900">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" />
            <p>
              Seluruh dokumen wajib telah terunggah. Periksa kembali kelengkapan berkas, lalu klik{" "}
              <span className="font-semibold">Simpan Dokumen</span> untuk mengunci secara permanen.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-slate-600">
          Daftar dokumen tidak dapat dimuat — coba muat ulang halaman.
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {slots.map((s) => (
            <div key={s.key} className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {slots.map((slot) => (
            <SlotCard
              key={slot.key}
              slot={slot}
              files={files.filter((f) => f.jenis === slot.key)}
              uploading={uploadingSlot === slot.key}
              locked={isLocked}
              highlightedMissing={showMissingAlert}
              onPick={handleUpload}
              onDelete={handleDelete}
              onPreview={setPreviewDoc}
              deletingId={deletingId}
            />
          ))}
        </div>
      )}

      {/* Confirm Final Save Pop-up */}
      {confirmSaveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => !locking && setConfirmSaveOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
                <Lock className="size-5" />
              </div>
              <div>
                <h2 className="font-heading text-base font-bold text-slate-900">Konfirmasi Simpan Dokumen</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Apakah Anda yakin semua dokumen sudah terupload dengan benar?
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-xs font-semibold text-slate-700">Ringkasan Berkas Terunggah</p>
              <ul className="mt-2 space-y-1.5 text-xs">
                {slots.map((slot) => {
                  const count = files.filter((f) => f.jenis === slot.key).length;
                  return (
                    <li key={slot.key} className="flex items-center justify-between gap-2">
                      <span className="text-slate-600">{slot.label}</span>
                      <span
                        className={`font-medium tabular-nums ${
                          count > 0 ? "text-emerald-700" : "text-slate-400"
                        }`}
                      >
                        {count > 0 ? `${count} berkas` : "Kosong (Opsional)"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-amber-800">
              Setelah memilih <span className="font-semibold">Lanjutkan</span>, dokumen akan dikunci secara permanen
              (tidak dapat diubah, dihapus, maupun ditambah lagi) dan layanan ini otomatis dipindahkan ke{" "}
              <span className="font-semibold">Riwayat & Arsip</span>.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={locking}
                onClick={() => setConfirmSaveOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={locking}
                onClick={handleConfirmLockSave}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 className="size-4" />
                <span>{locking ? "Menyimpan…" : "Lanjutkan"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setPreviewDoc(null)} />
          <div className="relative z-10 flex max-h-[90svh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{previewDoc.filename}</p>
                <p className="text-xs text-slate-500 tabular-nums">
                  {formatUkuran(previewDoc.size)} · {formatWaktu(previewDoc.uploaded_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/dokumen/${previewDoc.id}/unduh`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Download className="size-3.5" />
                  <span>Unduh</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100 p-4">
              {previewDoc.mime_type.startsWith("image/") ? (
                <img
                  src={`/api/dokumen/${previewDoc.id}/unduh?inline=1`}
                  alt={previewDoc.filename}
                  className="mx-auto max-h-[70svh] rounded-lg object-contain shadow"
                />
              ) : previewDoc.mime_type === "application/pdf" ? (
                <iframe
                  title={previewDoc.filename}
                  src={`/api/dokumen/${previewDoc.id}/unduh?inline=1`}
                  className="h-[70svh] w-full rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <div className="py-16 text-center text-sm text-slate-600">
                  Pratinjau langsung tidak tersedia untuk format berkas ini. Silakan unduh berkas untuk membukanya.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
