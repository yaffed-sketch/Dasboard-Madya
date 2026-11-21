import type { StatusSla } from "./types";

export const HARI_ID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"] as const;

export const BULAN_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export function hariDariTanggal(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return HARI_ID[d.getDay() === 0 ? 6 : d.getDay() - 1];
}

export function bagianTanggal(iso: string): { tanggal: string; bulan: string; tahun: string } {
  if (!iso) return { tanggal: "……", bulan: "……", tahun: "……" };
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { tanggal: "……", bulan: "……", tahun: "……" };
  return {
    tanggal: String(d.getDate()),
    bulan: BULAN_ID[d.getMonth()],
    tahun: String(d.getFullYear()),
  };
}

export function formatTanggal(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function formatTanggalSingkat(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function formatWaktu(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatUkuran(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function slaInfo(sisaHari: number): { label: string; tone: StatusSla } {
  if (sisaHari > 3) return { label: `${sisaHari} Hari Tersisa`, tone: "aman" };
  if (sisaHari >= 1) return { label: `${sisaHari} Hari Tersisa`, tone: "peringatan" };
  if (sisaHari === 0) return { label: "Jatuh Tempo Hari Ini", tone: "kritis" };
  return { label: `Terlambat ${Math.abs(sisaHari)} Hari`, tone: "kritis" };
}
