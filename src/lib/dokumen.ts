import type { DokumenJenis } from "./types";

export interface DokumenSlot {
  key: DokumenJenis;
  label: string;
  description: string;
  required: boolean;
  accept: string;
}

export const DOKUMEN_SLOTS: DokumenSlot[] = [
  {
    key: "persetujuan_jadwal",
    label: "Persetujuan Jadwal",
    description: "Surat konfirmasi tanggal dan jam pembukaan wasiat tertutup",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png",
  },
  {
    key: "surat_kuasa",
    label: "Surat Kuasa (Apabila Ada)",
    description: "Surat kuasa khusus apabila Kepala BHP Surabaya berhalangan",
    required: false,
    accept: ".pdf,.jpg,.jpeg,.png",
  },
  {
    key: "daftar_hadir",
    label: "Daftar Hadir",
    description: "Lembar tanda tangan kehadiran para pihak dan saksi",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png",
  },
  {
    key: "berita_acara",
    label: "Berita Acara",
    description: "Salinan pindaian Berita Acara resmi yang telah ditandatangani",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png",
  },
  {
    key: "wasiat_tertutup",
    label: "Wasiat Tertutup",
    description: "Arsip bundel wasiat tertutup yang telah dibuka secara resmi",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png",
  },
  {
    key: "dokumentasi",
    label: "Dokumentasi (Foto Kegiatan)",
    description: "Foto prosesi pembukaan segel dan pembacaan naskah wasiat",
    required: true,
    accept: ".jpg,.jpeg,.png,.webp",
  },
];

export const REQUIRED_DOKUMEN_KEYS: DokumenJenis[] = DOKUMEN_SLOTS.filter((s) => s.required).map((s) => s.key);

export function getDokumenSlots(adaSuratKuasa: boolean): DokumenSlot[] {
  return DOKUMEN_SLOTS.map((slot) => {
    if (slot.key !== "surat_kuasa") return slot;
    return adaSuratKuasa
      ? {
          ...slot,
          label: "Surat Kuasa",
          description: "Surat kuasa khusus wajib dilampirkan sesuai status kuasa pada Berita Acara",
          required: true,
        }
      : slot;
  });
}

export function getRequiredDokumenKeys(adaSuratKuasa: boolean): DokumenJenis[] {
  return getDokumenSlots(adaSuratKuasa)
    .filter((s) => s.required)
    .map((s) => s.key);
}
