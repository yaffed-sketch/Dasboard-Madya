import { CheckCircle2, FileText } from "lucide-react";
import { formatTanggalSingkat, formatWaktu } from "@/lib/format";
import type { Layanan } from "@/lib/types";

interface HistoryTableProps {
  rows: Layanan[];
  loading: boolean;
  error: boolean;
  onViewDocuments: (item: Layanan) => void;
}

export default function HistoryTable({ rows, loading, error, onViewDocuments }: HistoryTableProps) {
  if (loading) {
    return (
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-white px-6 py-10 text-center text-sm text-slate-600">
        Riwayat layanan tidak dapat dimuat — coba muat ulang halaman.
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
        <p className="font-heading text-base font-semibold text-slate-900">Belum ada arsip layanan selesai</p>
        <p className="mt-1 text-sm text-slate-500">
          Layanan yang telah selesai diproses akan tersimpan di sini beserta hasil akhir dokumen yang diunggah.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
              <th className="px-4 py-3.5">No. Layanan</th>
              <th className="px-4 py-3.5">Pemohon</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Tanggal Selesai</th>
              <th className="px-4 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((l) => (
              <tr key={l.id} className="transition-colors hover:bg-slate-50/70">
                <td className="px-4 py-3.5 align-top">
                  <div className="font-mono text-xs font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                    {l.no_layanan}
                  </div>
                </td>
                <td className="px-4 py-3.5 align-top">
                  <div className="font-medium text-slate-900">{l.pemohon}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    NIK <span className="font-mono">{l.pemohon_nik || "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 align-top">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="size-3.5 shrink-0" />
                    <span>Selesai</span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 tabular-nums">
                    Tenggat {formatTanggalSingkat(l.tenggat)}
                  </div>
                </td>
                <td className="px-4 py-3.5 align-top text-xs text-slate-700 tabular-nums whitespace-nowrap">
                  {l.selesai_at ? formatWaktu(l.selesai_at) : "—"}
                </td>
                <td className="px-4 py-3.5 text-right align-middle">
                  <button
                    type="button"
                    onClick={() => onViewDocuments(l)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap"
                  >
                    <FileText className="size-3.5 text-blue-600" />
                    <span>Lihat Dokumen</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((l) => (
          <div key={l.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-semibold text-slate-900 tabular-nums">{l.no_layanan}</p>
                <p className="mt-0.5 font-heading text-base font-semibold text-slate-900">{l.pemohon}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="size-3.5" />
                Selesai
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 tabular-nums">
              Selesai {l.selesai_at ? formatWaktu(l.selesai_at) : "—"}
            </p>
            <div className="mt-4 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => onViewDocuments(l)}
                className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <FileText className="size-4 text-blue-600" />
                <span>Lihat Dokumen</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
