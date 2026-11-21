import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import ArchiveDocumentsModal from "@/components/dashboard/ArchiveDocumentsModal";
import HistoryTable from "@/components/dashboard/HistoryTable";
import { apiGet } from "@/lib/api";
import type { Layanan } from "@/lib/types";

export default function History() {
  const [items, setItems] = useState<Layanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLayanan, setSelectedLayanan] = useState<Layanan | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiGet<Layanan[]>("/layanan/history");
      setItems(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (l) =>
        l.no_layanan.toLowerCase().includes(q) ||
        l.pemohon.toLowerCase().includes(q) ||
        l.pihak_kedua_nama.toLowerCase().includes(q) ||
        l.pemohon_nik.toLowerCase().includes(q),
    );
  }, [items, search]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Riwayat & Arsip Layanan
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Arsip layanan Wasiat Tertutup yang telah selesai diproses untuk melihat hasil akhir dokumen yang diunggah.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari arsip no. layanan atau pemohon…"
            aria-label="Cari arsip layanan"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
          />
        </div>
      </header>

      <HistoryTable
        rows={filtered}
        loading={loading}
        error={error}
        onViewDocuments={setSelectedLayanan}
      />

      <ArchiveDocumentsModal
        layanan={selectedLayanan}
        onClose={() => setSelectedLayanan(null)}
      />
    </div>
  );
}
