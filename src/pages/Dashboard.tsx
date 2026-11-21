import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { apiGet } from "@/lib/api";
import { slaInfo } from "@/lib/format";
import LayananTable from "@/components/dashboard/LayananTable";
import type { Layanan, StatusSla } from "@/lib/types";

const SLA_ORDER: Record<StatusSla, number> = {
  kritis: 0,
  peringatan: 1,
  aman: 2,
};

export default function Dashboard() {
  const [items, setItems] = useState<Layanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const aktif = await apiGet<Layanan[]>("/layanan");
      setItems(aktif);
      window.dispatchEvent(new Event("layanan-updated"));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const orderedAndFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? items.filter(
          (l) =>
            l.no_layanan.toLowerCase().includes(q) ||
            l.pemohon.toLowerCase().includes(q) ||
            l.pemohon_nik.toLowerCase().includes(q),
        )
      : [...items];

    return list.sort((a, b) => {
      const toneDiff = SLA_ORDER[slaInfo(a.sisa_hari).tone] - SLA_ORDER[slaInfo(b.sisa_hari).tone];
      if (toneDiff !== 0) return toneDiff;
      return a.sisa_hari - b.sisa_hari;
    });
  }, [items, search]);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title */}
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Daftar Layanan Wasiat Tertutup
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Kelola lanjutan hasil verifikasi: pantau tenggat SLA, susun Berita Acara resmi, cetak 2 salinan, dan lengkapi arsip berkas.
        </p>
      </header>

      {/* Search */}
      <section>
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari no. layanan, pemohon, NIK…"
            aria-label="Cari layanan aktif"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
          />
        </div>
      </section>

      {/* Active Services Table / Cards */}
      <LayananTable rows={orderedAndFiltered} loading={loading} error={error} />
    </div>
  );
}
