import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Archive, Menu, Scale, ScrollText, X } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { Layanan } from "@/lib/types";

const NAV_ITEMS = [
  { to: "/", label: "Daftar Layanan", icon: ScrollText, end: true, showActiveCount: true },
  { to: "/history", label: "Riwayat & Arsip", icon: Archive, end: false, showActiveCount: false },
];

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const location = useLocation();

  const fetchActiveCount = useCallback(async () => {
    try {
      const list = await apiGet<Layanan[]>("/layanan");
      setActiveCount(list.length);
    } catch {
      // ignore transient errors in background counter
    }
  }, []);

  useEffect(() => {
    fetchActiveCount();
  }, [fetchActiveCount, location.pathname]);

  useEffect(() => {
    const handler = () => {
      fetchActiveCount();
    };
    window.addEventListener("layanan-updated", handler);
    return () => window.removeEventListener("layanan-updated", handler);
  }, [fetchActiveCount]);

  const breadcrumbLabel = (() => {
    if (location.pathname === "/") return "Daftar Layanan";
    if (location.pathname.startsWith("/history")) return "Riwayat & Arsip";
    if (location.pathname.startsWith("/buat-ba")) return "Buat & Reviu Berita Acara";
    if (location.pathname.startsWith("/upload")) return "Kelengkapan Dokumen";
    return "Workspace";
  })();

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-950 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Scale className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="font-heading text-base font-bold tracking-tight text-white whitespace-nowrap">Madya</p>
            <p className="text-xs text-slate-400 truncate">Layanan Wasiat Tertutup</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          aria-label="Tutup navigasi"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-5" aria-label="Navigasi utama">
        <p className="px-3 pb-2 text-xs font-medium text-slate-500">Menu Utama</p>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, showActiveCount }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`
            }
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex flex-1 items-center justify-between gap-2">
              <span>{label}</span>
              {showActiveCount && activeCount !== null && (
                <span className="font-mono text-xs font-semibold tabular-nums opacity-95">
                  {activeCount}
                </span>
              )}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800/80 px-5 py-4">
        <p className="text-xs font-semibold text-slate-100">Fungsional Madya</p>
        <p className="mt-0.5 text-xs text-slate-400">Balai Harta Peninggalan Surabaya</p>
        <p className="mt-1 text-[11px] text-slate-500">Kementerian Hukum RI</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-svh bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-800 lg:sticky lg:top-0 lg:block lg:h-svh">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[82vw] shadow-2xl">{sidebarContent}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Top Bar (< lg) — compact single row */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Buka menu navigasi"
              className="flex size-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
            >
              <Menu className="size-5" />
            </button>
            <span className="font-heading text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Madya
            </span>
            <span className="text-slate-300" aria-hidden="true">/</span>
            <span className="truncate text-sm font-medium text-slate-600">{breadcrumbLabel}</span>
          </div>
        </header>

        {/* Desktop Contextual Breadcrumb Bar */}
        <div className="hidden h-14 items-center justify-between border-b border-slate-200 bg-white px-8 lg:flex">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-slate-500">Madya</span>
            <span className="text-slate-300" aria-hidden="true">/</span>
            <span className="font-semibold text-slate-900">{breadcrumbLabel}</span>
          </div>
          <p className="text-xs text-slate-500">Balai Harta Peninggalan Surabaya · Wasiat Tertutup</p>
        </div>

        <main className="mx-auto w-full max-w-[1320px] flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
