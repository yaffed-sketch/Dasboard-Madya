import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck2,
  FilePlus2,
  FolderUp,
} from "lucide-react";
import { formatTanggalSingkat, slaInfo } from "@/lib/format";
import type { Layanan, StatusSla } from "@/lib/types";

interface LayananTableProps {
  rows: Layanan[];
  loading: boolean;
  error: boolean;
}

const SLA_STYLE: Record<StatusSla, { text: string; icon: typeof Clock }> = {
  aman: { text: "text-emerald-700", icon: CheckCircle2 },
  peringatan: { text: "text-amber-700", icon: Clock },
  kritis: { text: "text-red-700", icon: AlertTriangle },
};

export default function LayananTable({
  rows,
  loading,
  error,
}: LayananTableProps) {
  if (loading) {
    return (
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
            <div className="h-8 w-36 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-white px-6 py-10 text-center text-sm text-slate-600">
        Data layanan tidak dapat dimuat saat ini. Muat ulang halaman untuk mencoba kembali.
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
        <p className="font-heading text-base font-semibold text-slate-900">Tidak ada layanan aktif yang cocok</p>
        <p className="mt-1 text-sm text-slate-500">
          Ubah kata kunci pencarian atau tunggu kiriman layanan dari tahap verifikasi sebelumnya.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop High-Density Table */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
              <th className="px-4 py-3.5">No. Layanan</th>
              <th className="px-4 py-3.5">Pemohon</th>
              <th className="px-4 py-3.5">SLA & Tenggat</th>
              <th className="px-4 py-3.5">Jadwal Pembukaan</th>
              <th className="px-4 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((l) => {
              const sla = slaInfo(l.sisa_hari);
              const SlaIcon = SLA_STYLE[sla.tone].icon;

              return (
                <tr key={l.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-3.5 align-top">
                    <div className="font-mono text-xs font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                      {l.no_layanan}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 align-top">
                    <div className="font-medium text-slate-900">{l.pemohon}</div>
                    {l.pemohon_jabatan && (
                      <div className="mt-0.5 text-xs text-slate-500">{l.pemohon_jabatan}</div>
                    )}
                  </td>

                  <td className="px-4 py-3.5 align-top">
                    <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${SLA_STYLE[sla.tone].text}`}>
                      <SlaIcon className="size-3.5 shrink-0" />
                      <span className="tabular-nums whitespace-nowrap">{sla.label}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                      Tenggat {formatTanggalSingkat(l.tenggat)}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 align-top">
                    <div className="text-sm text-slate-800 tabular-nums whitespace-nowrap">
                      {formatTanggalSingkat(l.jadwal_pembukaan)}
                    </div>
                    <div className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums">
                      {l.jam_pembukaan} WIB
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-right align-middle">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <Link
                        to={`/buat-ba/${l.id}`}
                        title={l.ba ? "Reviu Berita Acara" : "Buat Berita Acara"}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap"
                      >
                        {l.ba ? <FileCheck2 className="size-3.5 text-blue-600" /> : <FilePlus2 className="size-3.5 text-blue-600" />}
                        <span>{l.ba ? "Reviu BA" : "Buat BA"}</span>
                      </Link>

                      <Link
                        to={`/upload/${l.id}`}
                        title="Upload & Kelengkapan Dokumen"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap"
                      >
                        <FolderUp className="size-3.5 text-slate-600" />
                        <span>Upload</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Card List */}
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((l) => {
          const sla = slaInfo(l.sisa_hari);
          const SlaIcon = SLA_STYLE[sla.tone].icon;

          return (
            <div key={l.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-semibold text-slate-900 tabular-nums">{l.no_layanan}</p>
                  <p className="mt-0.5 font-heading text-base font-semibold text-slate-900">{l.pemohon}</p>
                </div>
                <div className={`inline-flex items-center gap-1 text-xs font-semibold ${SLA_STYLE[sla.tone].text}`}>
                  <SlaIcon className="size-3.5 shrink-0" />
                  <span className="tabular-nums">{sla.label}</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                <span className="tabular-nums">
                  Jadwal {formatTanggalSingkat(l.jadwal_pembukaan)}, {l.jam_pembukaan} WIB
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <Link
                  to={`/buat-ba/${l.id}`}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-medium text-white"
                >
                  {l.ba ? <FileCheck2 className="size-4" /> : <FilePlus2 className="size-4" />}
                  <span>{l.ba ? "Reviu BA" : "Buat BA"}</span>
                </Link>
                <Link
                  to={`/upload/${l.id}`}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700"
                >
                  <FolderUp className="size-4" />
                  <span>Upload</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
