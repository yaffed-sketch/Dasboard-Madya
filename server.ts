import crypto from "crypto";
import fs from "fs";
import path from "path";
import express from "express";
import multer from "multer";
import { createServer as createViteServer } from "vite";

type StatusLayanan = "aktif" | "selesai";
type StatusSla = "aman" | "peringatan" | "kritis";
type DokumenJenis =
  | "persetujuan_jadwal"
  | "surat_kuasa"
  | "daftar_hadir"
  | "berita_acara"
  | "wasiat_tertutup"
  | "dokumentasi";

interface BaRecord {
  nomor_ba: string;
  ada_surat_kuasa: boolean;
  tanggal_surat_kuasa: string;
  hari: string;
  tanggal: string;
  tempat_dibuat: string;
  pihak_pertama_nama: string;
  pihak_pertama_nip: string;
  pihak_pertama_jabatan: string;
  pihak_kedua_nama: string;
  pihak_kedua_jabatan: string;
  pihak_kedua_alamat: string;
  deskripsi_wasiat: string;
  nama_pewasiat: string;
  saksi_1: string;
  saksi_2: string;
  created_at: string;
  updated_at: string;
}

interface LayananRecord {
  id: string;
  no_layanan: string;
  nomor_ba?: string;
  jenis_layanan: string;
  pemohon: string;
  pemohon_nik: string;
  pemohon_jabatan?: string;
  pemohon_alamat: string;
  pihak_kedua_nama: string;
  pihak_kedua_nik: string;
  pihak_kedua_alamat: string;
  pihak_kedua_peran: string;
  nama_pewasiat?: string;
  deskripsi_wasiat?: string;
  ada_surat_kuasa?: boolean;
  tanggal_surat_kuasa?: string;
  sla_hari: number;
  tenggat: string;
  jadwal_pembukaan: string;
  jam_pembukaan: string;
  tempat: string;
  notaris_nama: string;
  notaris_sk: string;
  pejabat_nama?: string;
  pejabat_nip?: string;
  pejabat_jabatan?: string;
  kepala_bhp_nama?: string;
  kepala_bhp_nip?: string;
  kepala_bhp_jabatan?: string;
  status: StatusLayanan;
  ba: BaRecord | null;
  dokumen_terkunci?: boolean;
  dokumen_dikunci_at?: string | null;
  created_at: string;
  selesai_at: string | null;
}

interface DokumenRecord {
  id: string;
  layanan_id: string;
  jenis: DokumenJenis;
  filename: string;
  stored_name: string;
  mime_type: string;
  size: number;
  uploaded_at: string;
}

interface ApprovalCodeRecord {
  code: string;
  recipient_email: string;
  created_at: number;
  expires_at: number;
}

interface DbStore {
  layanan: LayananRecord[];
  dokumen: DokumenRecord[];
  approval_codes?: Record<string, ApprovalCodeRecord>;
}

const MADYA_REGISTERED_EMAIL = process.env.MADYA_APPROVAL_EMAIL || "yaffed@gmail.com";
const APPROVAL_TTL_MS = 10 * 60 * 1000;
const DATA_DIR = path.resolve(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const DB_PATH = path.join(DATA_DIR, "db.json");
const REQUIRED_SLOTS: DokumenJenis[] = [
  "persetujuan_jadwal",
  "daftar_hadir",
  "berita_acara",
  "wasiat_tertutup",
  "dokumentasi",
];

const SLOT_LABELS: Record<DokumenJenis, string> = {
  persetujuan_jadwal: "Persetujuan Jadwal",
  surat_kuasa: "Surat Kuasa",
  daftar_hadir: "Daftar Hadir",
  berita_acara: "Berita Acara",
  wasiat_tertutup: "Wasiat Tertutup",
  dokumentasi: "Dokumentasi (Foto Kegiatan)",
};

function getRequiredSlots(item: LayananRecord): DokumenJenis[] {
  const adaSuratKuasa = Boolean(item.ba?.ada_surat_kuasa ?? item.ada_surat_kuasa);
  return adaSuratKuasa
    ? ["persetujuan_jadwal", "surat_kuasa", "daftar_hadir", "berita_acara", "wasiat_tertutup", "dokumentasi"]
    : [...REQUIRED_SLOTS];
}

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function isoDateOffset(offsetDays: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function createSeedData(): DbStore {
  const nowIso = new Date().toISOString();
  const yesterdayIso = new Date(Date.now() - 86400000 * 3).toISOString();
  const lastWeekIso = new Date(Date.now() - 86400000 * 9).toISOString();

  return {
    layanan: [
      {
        id: "ada15548-c47d-494d-9da1-816e8dbe7fbb",
        no_layanan: "Wasiat Tertutup-00003/XI/2026",
        nomor_ba: "W15.BHP.02-00003/BA-WT/XI/2026",
        jenis_layanan: "Wasiat Tertutup",
        pemohon: "H. Ahmad Suryana, S.H., M.Kn.",
        pemohon_nik: "3578041506680003",
        pemohon_jabatan: "Notaris Kota Surabaya",
        pemohon_alamat: "Jl. Darmo Permai Selatan No. 45, Kota Surabaya",
        pihak_kedua_nama: "Alm. Drs. Bambang Wijanarko",
        pihak_kedua_nik: "3578045208920001",
        pihak_kedua_alamat: "Jl. Kertajaya Indah No. 18, Kota Surabaya",
        pihak_kedua_peran: "Pewasiat",
        nama_pewasiat: "Alm. Drs. Bambang Wijanarko",
        deskripsi_wasiat: "1 (satu) buah amplop coklat ukuran A4 dalam keadaan tertutup dan tersegel lak merah",
        ada_surat_kuasa: true,
        tanggal_surat_kuasa: isoDateOffset(-1),
        sla_hari: 3,
        tenggat: isoDateOffset(2),
        jadwal_pembukaan: isoDateOffset(1),
        jam_pembukaan: "10:00",
        tempat: "Balai Harta Peninggalan Surabaya, Jl. Jenderal S. Parman No. 58, Waru, Sidoarjo",
        notaris_nama: "Ayu Rachmawati, S.H., M.Kn.",
        notaris_sk: "NIP. 198405122010122001",
        pejabat_nama: "Ayu Rachmawati, S.H., M.Kn.",
        pejabat_nip: "198405122010122001",
        pejabat_jabatan: "Kurator Keperdataan Ahli Madya",
        kepala_bhp_nama: "Hendro Setyawan, S.H., M.H.",
        kepala_bhp_nip: "197503182001121001",
        kepala_bhp_jabatan: "Kepala Balai Harta Peninggalan Surabaya",
        status: "aktif",
        ba: {
          nomor_ba: "W15.BHP.02-00003/BA-WT/XI/2026",
          ada_surat_kuasa: true,
          tanggal_surat_kuasa: isoDateOffset(-1),
          hari: "Sabtu",
          tanggal: isoDateOffset(1),
          tempat_dibuat: "Sidoarjo",
          pihak_pertama_nama: "Ayu Rachmawati, S.H., M.Kn.",
          pihak_pertama_nip: "198405122010122001",
          pihak_pertama_jabatan: "Kurator Keperdataan Ahli Madya",
          pihak_kedua_nama: "H. Ahmad Suryana, S.H., M.Kn.",
          pihak_kedua_jabatan: "Notaris Kota Surabaya",
          pihak_kedua_alamat: "Jl. Darmo Permai Selatan No. 45, Kota Surabaya",
          deskripsi_wasiat: "1 (satu) buah amplop coklat ukuran A4 dalam keadaan tertutup dan tersegel lak merah",
          nama_pewasiat: "Alm. Drs. Bambang Wijanarko",
          saksi_1: "Budi Santoso, S.H.",
          saksi_2: "Rina Wulandari",
          created_at: nowIso,
          updated_at: nowIso,
        },
        created_at: yesterdayIso,
        selesai_at: null,
      },
      {
        id: "420ecbcb-c2dd-4046-8f74-49ca8f14809a",
        no_layanan: "Wasiat Tertutup-00002/XI/2026",
        nomor_ba: "W15.BHP.02-00002/BA-WT/XI/2026",
        jenis_layanan: "Wasiat Tertutup",
        pemohon: "Ratna Puspitasari, S.H., M.Kn.",
        pemohon_nik: "3578774807010012",
        pemohon_jabatan: "Notaris Kota Surabaya",
        pemohon_alamat: "Jl. Mayjen Sungkono No. 22, Kota Surabaya",
        pihak_kedua_nama: "Alm. Hendra Wijaya",
        pihak_kedua_nik: "3578111105790011",
        pihak_kedua_alamat: "Jl. Raya Darmo No. 7, Kota Surabaya",
        pihak_kedua_peran: "Pewasiat",
        nama_pewasiat: "Alm. Hendra Wijaya",
        deskripsi_wasiat: "1 (satu) buah amplop coklat ukuran A4 dalam keadaan tertutup dan tersegel",
        ada_surat_kuasa: false,
        tanggal_surat_kuasa: "",
        sla_hari: 2,
        tenggat: isoDateOffset(0),
        jadwal_pembukaan: isoDateOffset(0),
        jam_pembukaan: "13:30",
        tempat: "Balai Harta Peninggalan Surabaya, Jl. Jenderal S. Parman No. 58, Waru, Sidoarjo",
        notaris_nama: "Ayu Rachmawati, S.H., M.Kn.",
        notaris_sk: "NIP. 198405122010122001",
        pejabat_nama: "Ayu Rachmawati, S.H., M.Kn.",
        pejabat_nip: "198405122010122001",
        pejabat_jabatan: "Kurator Keperdataan Ahli Madya",
        kepala_bhp_nama: "Hendro Setyawan, S.H., M.H.",
        kepala_bhp_nip: "197503182001121001",
        kepala_bhp_jabatan: "Kepala Balai Harta Peninggalan Surabaya",
        status: "aktif",
        ba: null,
        created_at: yesterdayIso,
        selesai_at: null,
      },
      {
        id: "5505fdd1-0492-47da-96f7-98e7f478fbef",
        no_layanan: "Wasiat Tertutup-00001/XI/2026",
        nomor_ba: "W15.BHP.02-00001/BA-WT/XI/2026",
        jenis_layanan: "Wasiat Tertutup",
        pemohon: "Dedi Kurniawan, S.H., M.Kn.",
        pemohon_nik: "3578773012830004",
        pemohon_jabatan: "Notaris Kabupaten Sidoarjo",
        pemohon_alamat: "Jl. Ahmad Yani No. 12, Kec. Waru, Kab. Sidoarjo",
        pihak_kedua_nama: "Alm. Rina Marlina",
        pihak_kedua_nik: "3578119906840002",
        pihak_kedua_alamat: "Jl. Merdeka No. 44, Kota Surabaya",
        pihak_kedua_peran: "Pewasiat",
        nama_pewasiat: "Alm. Rina Marlina",
        deskripsi_wasiat: "1 (satu) buah sampul putih bersegel lak dengan tanda tangan Notaris penyimpan",
        ada_surat_kuasa: false,
        tanggal_surat_kuasa: "",
        sla_hari: 3,
        tenggat: isoDateOffset(-2),
        jadwal_pembukaan: isoDateOffset(-2),
        jam_pembukaan: "09:30",
        tempat: "Balai Harta Peninggalan Surabaya, Jl. Jenderal S. Parman No. 58, Waru, Sidoarjo",
        notaris_nama: "Ayu Rachmawati, S.H., M.Kn.",
        notaris_sk: "NIP. 198405122010122001",
        pejabat_nama: "Ayu Rachmawati, S.H., M.Kn.",
        pejabat_nip: "198405122010122001",
        pejabat_jabatan: "Kurator Keperdataan Ahli Madya",
        kepala_bhp_nama: "Hendro Setyawan, S.H., M.H.",
        kepala_bhp_nip: "197503182001121001",
        kepala_bhp_jabatan: "Kepala Balai Harta Peninggalan Surabaya",
        status: "aktif",
        ba: {
          nomor_ba: "W15.BHP.02-00001/BA-WT/XI/2026",
          ada_surat_kuasa: false,
          tanggal_surat_kuasa: "",
          hari: "Rabu",
          tanggal: isoDateOffset(-2),
          tempat_dibuat: "Sidoarjo",
          pihak_pertama_nama: "Hendro Setyawan, S.H., M.H.",
          pihak_pertama_nip: "197503182001121001",
          pihak_pertama_jabatan: "Kepala Balai Harta Peninggalan Surabaya",
          pihak_kedua_nama: "Dedi Kurniawan, S.H., M.Kn.",
          pihak_kedua_jabatan: "Notaris Kabupaten Sidoarjo",
          pihak_kedua_alamat: "Jl. Ahmad Yani No. 12, Kec. Waru, Kab. Sidoarjo",
          deskripsi_wasiat: "1 (satu) buah sampul putih bersegel lak dengan tanda tangan Notaris penyimpan",
          nama_pewasiat: "Alm. Rina Marlina",
          saksi_1: "Slamet Riyadi",
          saksi_2: "Dewi Anggraini",
          created_at: yesterdayIso,
          updated_at: yesterdayIso,
        },
        created_at: lastWeekIso,
        selesai_at: null,
      },
      {
        id: "1e5a1d1e-3f61-4a90-b7d0-e9dc2ae69e90",
        no_layanan: "Wasiat Tertutup-00004/XI/2026",
        nomor_ba: "W15.BHP.02-00004/BA-WT/XI/2026",
        jenis_layanan: "Wasiat Tertutup",
        pemohon: "Farman Sobana Putra, S.H., M.Kn.",
        pemohon_nik: "3578770203950007",
        pemohon_jabatan: "Notaris Kota Malang",
        pemohon_alamat: "Jl. Ijen No. 14, Kota Malang",
        pihak_kedua_nama: "Alm. Dewi Kartika",
        pihak_kedua_nik: "3578114404880005",
        pihak_kedua_alamat: "Jl. Dewi Sartika No. 3, Kota Malang",
        pihak_kedua_peran: "Pewasiat",
        nama_pewasiat: "Alm. Dewi Kartika",
        deskripsi_wasiat: "1 (satu) buah amplop coklat ukuran A4 dalam keadaan tertutup dan tersegel",
        ada_surat_kuasa: true,
        tanggal_surat_kuasa: isoDateOffset(2),
        sla_hari: 5,
        tenggat: isoDateOffset(5),
        jadwal_pembukaan: isoDateOffset(4),
        jam_pembukaan: "11:00",
        tempat: "Balai Harta Peninggalan Surabaya, Jl. Jenderal S. Parman No. 58, Waru, Sidoarjo",
        notaris_nama: "Ayu Rachmawati, S.H., M.Kn.",
        notaris_sk: "NIP. 198405122010122001",
        pejabat_nama: "Ayu Rachmawati, S.H., M.Kn.",
        pejabat_nip: "198405122010122001",
        pejabat_jabatan: "Kurator Keperdataan Ahli Madya",
        kepala_bhp_nama: "Hendro Setyawan, S.H., M.H.",
        kepala_bhp_nip: "197503182001121001",
        kepala_bhp_jabatan: "Kepala Balai Harta Peninggalan Surabaya",
        status: "aktif",
        ba: null,
        created_at: nowIso,
        selesai_at: null,
      },
      {
        id: "7b92c4e1-9a10-4b2c-8e33-190a4d22e801",
        no_layanan: "Wasiat Tertutup-00005/XI/2026",
        nomor_ba: "W15.BHP.02-00005/BA-WT/XI/2026",
        jenis_layanan: "Wasiat Tertutup",
        pemohon: "Dra. Endang Lestari, S.H., M.Kn.",
        pemohon_nik: "3578014409650009",
        pemohon_jabatan: "Notaris Kota Surabaya",
        pemohon_alamat: "Jl. Raya Gubeng No. 19, Kota Surabaya",
        pihak_kedua_nama: "Alm. Bima Pratama Putra",
        pihak_kedua_nik: "3578011205940004",
        pihak_kedua_alamat: "Jl. Diponegoro No. 102, Kota Surabaya",
        pihak_kedua_peran: "Pewasiat",
        nama_pewasiat: "Alm. Bima Pratama Putra",
        deskripsi_wasiat: "1 (satu) buah amplop coklat ukuran A4 dalam keadaan tertutup dan tersegel",
        ada_surat_kuasa: true,
        tanggal_surat_kuasa: isoDateOffset(3),
        sla_hari: 7,
        tenggat: isoDateOffset(7),
        jadwal_pembukaan: isoDateOffset(6),
        jam_pembukaan: "14:00",
        tempat: "Balai Harta Peninggalan Surabaya, Jl. Jenderal S. Parman No. 58, Waru, Sidoarjo",
        notaris_nama: "Ayu Rachmawati, S.H., M.Kn.",
        notaris_sk: "NIP. 198405122010122001",
        pejabat_nama: "Ayu Rachmawati, S.H., M.Kn.",
        pejabat_nip: "198405122010122001",
        pejabat_jabatan: "Kurator Keperdataan Ahli Madya",
        kepala_bhp_nama: "Hendro Setyawan, S.H., M.H.",
        kepala_bhp_nip: "197503182001121001",
        kepala_bhp_jabatan: "Kepala Balai Harta Peninggalan Surabaya",
        status: "aktif",
        ba: {
          nomor_ba: "W15.BHP.02-00005/BA-WT/XI/2026",
          ada_surat_kuasa: true,
          tanggal_surat_kuasa: isoDateOffset(3),
          hari: "Kamis",
          tanggal: isoDateOffset(6),
          tempat_dibuat: "Sidoarjo",
          pihak_pertama_nama: "Ayu Rachmawati, S.H., M.Kn.",
          pihak_pertama_nip: "198405122010122001",
          pihak_pertama_jabatan: "Kurator Keperdataan Ahli Madya",
          pihak_kedua_nama: "Dra. Endang Lestari, S.H., M.Kn.",
          pihak_kedua_jabatan: "Notaris Kota Surabaya",
          pihak_kedua_alamat: "Jl. Raya Gubeng No. 19, Kota Surabaya",
          deskripsi_wasiat: "1 (satu) buah amplop coklat ukuran A4 dalam keadaan tertutup dan tersegel",
          nama_pewasiat: "Alm. Bima Pratama Putra",
          saksi_1: "Agus Setiawan",
          saksi_2: "Maya Puspita",
          created_at: nowIso,
          updated_at: nowIso,
        },
        created_at: nowIso,
        selesai_at: null,
      },
      {
        id: "d65ec40f-dab9-49db-ac8f-2730ee6d41de",
        no_layanan: "Wasiat Tertutup-00012/X/2026",
        nomor_ba: "W15.BHP.02-00012/BA-WT/X/2026",
        jenis_layanan: "Wasiat Tertutup",
        pemohon: "Hendra Gunawan, S.H., M.Kn.",
        pemohon_nik: "3578771204780015",
        pemohon_jabatan: "Notaris Kabupaten Gresik",
        pemohon_alamat: "Jl. Dr. Wahidin Sudirohusodo No. 11, Kab. Gresik",
        pihak_kedua_nama: "Alm. Ratih Kumalasari",
        pihak_kedua_nik: "3578118703850008",
        pihak_kedua_alamat: "Jl. Pahlawan No. 21, Kota Surabaya",
        pihak_kedua_peran: "Pewasiat",
        nama_pewasiat: "Alm. Ratih Kumalasari",
        deskripsi_wasiat: "1 (satu) buah amplop coklat ukuran A4 dalam keadaan tertutup dan tersegel",
        ada_surat_kuasa: true,
        tanggal_surat_kuasa: isoDateOffset(-16),
        sla_hari: 5,
        tenggat: isoDateOffset(-12),
        jadwal_pembukaan: isoDateOffset(-14),
        jam_pembukaan: "10:00",
        tempat: "Balai Harta Peninggalan Surabaya, Jl. Jenderal S. Parman No. 58, Waru, Sidoarjo",
        notaris_nama: "Ayu Rachmawati, S.H., M.Kn.",
        notaris_sk: "NIP. 198405122010122001",
        pejabat_nama: "Ayu Rachmawati, S.H., M.Kn.",
        pejabat_nip: "198405122010122001",
        pejabat_jabatan: "Kurator Keperdataan Ahli Madya",
        kepala_bhp_nama: "Hendro Setyawan, S.H., M.H.",
        kepala_bhp_nip: "197503182001121001",
        kepala_bhp_jabatan: "Kepala Balai Harta Peninggalan Surabaya",
        status: "selesai",
        ba: {
          nomor_ba: "W15.BHP.02-00012/BA-WT/X/2026",
          ada_surat_kuasa: true,
          tanggal_surat_kuasa: isoDateOffset(-16),
          hari: "Jumat",
          tanggal: isoDateOffset(-14),
          tempat_dibuat: "Sidoarjo",
          pihak_pertama_nama: "Ayu Rachmawati, S.H., M.Kn.",
          pihak_pertama_nip: "198405122010122001",
          pihak_pertama_jabatan: "Kurator Keperdataan Ahli Madya",
          pihak_kedua_nama: "Hendra Gunawan, S.H., M.Kn.",
          pihak_kedua_jabatan: "Notaris Kabupaten Gresik",
          pihak_kedua_alamat: "Jl. Dr. Wahidin Sudirohusodo No. 11, Kab. Gresik",
          deskripsi_wasiat: "1 (satu) buah amplop coklat ukuran A4 dalam keadaan tertutup dan tersegel",
          nama_pewasiat: "Alm. Ratih Kumalasari",
          saksi_1: "Eko Prasetyo",
          saksi_2: "Nadia Kartika",
          created_at: lastWeekIso,
          updated_at: lastWeekIso,
        },
        created_at: lastWeekIso,
        selesai_at: new Date(Date.now() - 86400000 * 11).toISOString(),
      },
      {
        id: "500e8719-8d09-4cdf-8e15-c38819b9f36c",
        no_layanan: "Wasiat Tertutup-00011/X/2026",
        nomor_ba: "W15.BHP.02-00011/BA-WT/X/2026",
        jenis_layanan: "Wasiat Tertutup",
        pemohon: "Maria Yuliana Sutanto, S.H., M.Kn.",
        pemohon_nik: "3578776609800011",
        pemohon_jabatan: "Notaris Kota Surabaya",
        pemohon_alamat: "Jl. Basuki Rahmat No. 3, Kota Surabaya",
        pihak_kedua_nama: "Alm. Anton Setiawan",
        pihak_kedua_nik: "3578115504700004",
        pihak_kedua_alamat: "Jl. Jemursari No. 9, Kota Surabaya",
        pihak_kedua_peran: "Pewasiat",
        nama_pewasiat: "Alm. Anton Setiawan",
        deskripsi_wasiat: "1 (satu) buah amplop coklat ukuran A4 dalam keadaan tertutup dan tersegel",
        ada_surat_kuasa: false,
        tanggal_surat_kuasa: "",
        sla_hari: 5,
        tenggat: isoDateOffset(-19),
        jadwal_pembukaan: isoDateOffset(-21),
        jam_pembukaan: "09:00",
        tempat: "Balai Harta Peninggalan Surabaya, Jl. Jenderal S. Parman No. 58, Waru, Sidoarjo",
        notaris_nama: "Ayu Rachmawati, S.H., M.Kn.",
        notaris_sk: "NIP. 198405122010122001",
        pejabat_nama: "Ayu Rachmawati, S.H., M.Kn.",
        pejabat_nip: "198405122010122001",
        pejabat_jabatan: "Kurator Keperdataan Ahli Madya",
        kepala_bhp_nama: "Hendro Setyawan, S.H., M.H.",
        kepala_bhp_nip: "197503182001121001",
        kepala_bhp_jabatan: "Kepala Balai Harta Peninggalan Surabaya",
        status: "selesai",
        ba: {
          nomor_ba: "W15.BHP.02-00011/BA-WT/X/2026",
          ada_surat_kuasa: false,
          tanggal_surat_kuasa: "",
          hari: "Rabu",
          tanggal: isoDateOffset(-21),
          tempat_dibuat: "Sidoarjo",
          pihak_pertama_nama: "Hendro Setyawan, S.H., M.H.",
          pihak_pertama_nip: "197503182001121001",
          pihak_pertama_jabatan: "Kepala Balai Harta Peninggalan Surabaya",
          pihak_kedua_nama: "Maria Yuliana Sutanto, S.H., M.Kn.",
          pihak_kedua_jabatan: "Notaris Kota Surabaya",
          pihak_kedua_alamat: "Jl. Basuki Rahmat No. 3, Kota Surabaya",
          deskripsi_wasiat: "1 (satu) buah amplop coklat ukuran A4 dalam keadaan tertutup dan tersegel",
          nama_pewasiat: "Alm. Anton Setiawan",
          saksi_1: "Rizky Ramadhan",
          saksi_2: "Indah Permatasari",
          created_at: new Date(Date.now() - 86400000 * 21).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 20).toISOString(),
        },
        created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
        selesai_at: new Date(Date.now() - 86400000 * 18).toISOString(),
      },
    ],
    dokumen: [],
  };
}

function readDb(): DbStore {
  ensureDirs();
  if (!fs.existsSync(DB_PATH)) {
    const seed = createSeedData();
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2), "utf-8");
    return seed;
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw) as DbStore;
}

function writeDb(db: DbStore) {
  ensureDirs();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

function computeSisaHari(tenggatIso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${tenggatIso}T00:00:00`);
  if (Number.isNaN(target.getTime())) return 0;
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function computeSlaStatus(sisaHari: number): StatusSla {
  if (sisaHari > 3) return "aman";
  if (sisaHari >= 1) return "peringatan";
  return "kritis";
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}***@${domain}`;
}

function verifyApprovalCode(db: DbStore, layananId: string, submittedCode: string): { valid: boolean; reason: string } {
  const clean = String(submittedCode || "").trim();
  if (!clean) {
    return { valid: false, reason: "Kode persetujuan belum dimasukkan." };
  }
  const rec = db.approval_codes?.[layananId];
  if (!rec) {
    return { valid: false, reason: "Belum ada kode persetujuan aktif. Silakan pesan kode terlebih dahulu." };
  }
  if (Date.now() > rec.expires_at) {
    return { valid: false, reason: "Kode persetujuan telah kedaluwarsa. Silakan pesan kode baru." };
  }
  const a = Buffer.from(clean);
  const b = Buffer.from(rec.code);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false, reason: "Kode persetujuan tidak sesuai." };
  }
  return { valid: true, reason: "Kode persetujuan terverifikasi." };
}

async function dispatchApprovalEmail(
  recipient: string,
  code: string,
  noLayanan: string,
  pemohon: string,
): Promise<{ mode: "resend" | "simulasi" }> {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || "Madya Notaris <noreply@madya-notaris.id>",
        to: [recipient],
        subject: `Kode Persetujuan BA Wasiat Tertutup (${noLayanan})`,
        text: `Kode persetujuan untuk Berita Acara Pembukaan Wasiat Tertutup layanan ${noLayanan} (${pemohon}) adalah: ${code}. Berlaku selama 10 menit.`,
      }),
    });
    if (resp.ok) {
      return { mode: "resend" };
    }
  }
  return { mode: "simulasi" };
}

function normalizeBa(ba: Record<string, unknown> | null, l: LayananRecord): BaRecord | null {
  if (!ba) return null;
  if (typeof ba.pihak_pertama_nip === "string" && typeof ba.deskripsi_wasiat === "string") {
    return {
      ...(ba as unknown as BaRecord),
      ada_surat_kuasa: typeof ba.ada_surat_kuasa === "boolean" ? ba.ada_surat_kuasa : Boolean(l.ada_surat_kuasa ?? true),
    };
  }
  const adaSuratKuasa = Boolean(l.ada_surat_kuasa);
  return {
    nomor_ba: String(ba.nomor_ba || `W15.BHP.02-${l.no_layanan}`),
    ada_surat_kuasa: adaSuratKuasa,
    tanggal_surat_kuasa: String(ba.tanggal_surat_kuasa || l.jadwal_pembukaan || ""),
    hari: String(ba.hari || ""),
    tanggal: String(ba.tanggal || l.jadwal_pembukaan || ""),
    tempat_dibuat: String(ba.tempat_dibuat || "Sidoarjo"),
    pihak_pertama_nama: adaSuratKuasa
      ? String(l.pejabat_nama || l.notaris_nama || "Ayu Rachmawati, S.H., M.Kn.")
      : String(l.kepala_bhp_nama || "Hendro Setyawan, S.H., M.H."),
    pihak_pertama_nip: adaSuratKuasa
      ? String(l.pejabat_nip || "198405122010122001")
      : String(l.kepala_bhp_nip || "197503182001121001"),
    pihak_pertama_jabatan: adaSuratKuasa
      ? String(l.pejabat_jabatan || "Kurator Keperdataan Ahli Madya")
      : String(l.kepala_bhp_jabatan || "Kepala Balai Harta Peninggalan Surabaya"),
    pihak_kedua_nama: String(l.pemohon || ""),
    pihak_kedua_jabatan: String(l.pemohon_jabatan || "Notaris / Pemohon"),
    pihak_kedua_alamat: String(l.pemohon_alamat || ""),
    deskripsi_wasiat: String(l.deskripsi_wasiat || "1 (satu) buah amplop coklat ukuran A4 dalam keadaan tertutup dan tersegel"),
    nama_pewasiat: String(l.nama_pewasiat || l.pihak_kedua_nama || ""),
    saksi_1: String(ba.saksi_1 || ""),
    saksi_2: String(ba.saksi_2 || ""),
    created_at: String(ba.created_at || new Date().toISOString()),
    updated_at: String(ba.updated_at || new Date().toISOString()),
  };
}

function enrichLayanan(item: LayananRecord, docs: DokumenRecord[]) {
  const sisa_hari = computeSisaHari(item.tenggat);
  const status_sla = computeSlaStatus(sisa_hari);
  const itemDocs = docs.filter((d) => d.layanan_id === item.id);
  const requiredSlots = getRequiredSlots(item);
  const presentRequired = new Set(itemDocs.filter((d) => requiredSlots.includes(d.jenis)).map((d) => d.jenis));
  return {
    ...item,
    ba: normalizeBa(item.ba as unknown as Record<string, unknown> | null, item),
    sisa_hari,
    status_sla,
    dokumen_terkunci: Boolean(item.dokumen_terkunci),
    dokumen_dikunci_at: item.dokumen_dikunci_at ?? null,
    dokumen_wajib_count: presentRequired.size,
    dokumen_wajib_total: requiredSlots.length,
    dokumen_total_count: itemDocs.length,
  };
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureDirs();
      cb(null, UPLOADS_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  // List active layanan
  app.get("/api/layanan", (_req, res) => {
    const db = readDb();
    const list = db.layanan
      .filter((l) => l.status === "aktif")
      .map((l) => enrichLayanan(l, db.dokumen))
      .sort((a, b) => a.sisa_hari - b.sisa_hari);
    res.json(list);
  });

  // List completed layanan (history)
  app.get("/api/layanan/history", (_req, res) => {
    const db = readDb();
    const list = db.layanan
      .filter((l) => l.status === "selesai")
      .map((l) => enrichLayanan(l, db.dokumen))
      .sort((a, b) => (b.selesai_at ?? "").localeCompare(a.selesai_at ?? ""));
    res.json(list);
  });

  // Get single layanan
  app.get("/api/layanan/:id", (req, res) => {
    const db = readDb();
    const item = db.layanan.find((l) => l.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: "Layanan tidak ditemukan" });
      return;
    }
    res.json(enrichLayanan(item, db.dokumen));
  });

  // Create new layanan
  app.post("/api/layanan", (req, res) => {
    const b = req.body ?? {};
    if (!b.no_layanan || !b.pemohon || !b.pihak_kedua_nama || !b.tenggat || !b.jadwal_pembukaan) {
      res.status(400).json({ error: "Nomor layanan, pemohon, pihak kedua, tenggat, dan jadwal pembukaan wajib diisi" });
      return;
    }
    const db = readDb();
    const sisa = computeSisaHari(b.tenggat);
    const rawNo = String(b.no_layanan).trim();
    const suffix = rawNo.includes("-") ? rawNo.slice(rawNo.indexOf("-") + 1) : rawNo;
    const defaultNomorBa = `W15.BHP.02-${suffix.includes("/") ? suffix.replace("/", "/BA-WT/") : suffix}`;
    const created: LayananRecord = {
      id: crypto.randomUUID(),
      no_layanan: rawNo,
      nomor_ba: b.nomor_ba ? String(b.nomor_ba).trim() : defaultNomorBa,
      jenis_layanan: String(b.jenis_layanan || "Wasiat Tertutup").trim(),
      pemohon: String(b.pemohon).trim(),
      pemohon_nik: String(b.pemohon_nik || "").trim(),
      pemohon_jabatan: String(b.pemohon_jabatan || "Notaris").trim(),
      pemohon_alamat: String(b.pemohon_alamat || "").trim(),
      pihak_kedua_nama: String(b.pihak_kedua_nama).trim(),
      pihak_kedua_nik: String(b.pihak_kedua_nik || "").trim(),
      pihak_kedua_alamat: String(b.pihak_kedua_alamat || "").trim(),
      pihak_kedua_peran: String(b.pihak_kedua_peran || "Pewasiat").trim(),
      nama_pewasiat: String(b.nama_pewasiat || b.pihak_kedua_nama || "").trim(),
      deskripsi_wasiat: String(
        b.deskripsi_wasiat || "1 (satu) buah amplop coklat ukuran A4 dalam keadaan tertutup dan tersegel"
      ).trim(),
      ada_surat_kuasa: Boolean(b.ada_surat_kuasa),
      tanggal_surat_kuasa: b.ada_surat_kuasa ? String(b.tanggal_surat_kuasa || "").trim() : "",
      sla_hari: Math.max(1, sisa),
      tenggat: String(b.tenggat),
      jadwal_pembukaan: String(b.jadwal_pembukaan),
      jam_pembukaan: String(b.jam_pembukaan || "10:00"),
      tempat: String(
        b.tempat || "Balai Harta Peninggalan Surabaya, Jl. Jenderal S. Parman No. 58, Waru, Sidoarjo"
      ).trim(),
      notaris_nama: String(b.notaris_nama || b.pemohon || "Notaris").trim(),
      notaris_sk: String(b.notaris_sk || "").trim(),
      pejabat_nama: String(b.pejabat_nama || "Ayu Rachmawati, S.H., M.Kn.").trim(),
      pejabat_nip: String(b.pejabat_nip || "198405122010122001").trim(),
      pejabat_jabatan: String(b.pejabat_jabatan || "Kurator Keperdataan Ahli Madya").trim(),
      kepala_bhp_nama: String(b.kepala_bhp_nama || "Hendro Setyawan, S.H., M.H.").trim(),
      kepala_bhp_nip: String(b.kepala_bhp_nip || "197503182001121001").trim(),
      kepala_bhp_jabatan: String(b.kepala_bhp_jabatan || "Kepala Balai Harta Peninggalan Surabaya").trim(),
      status: "aktif",
      ba: null,
      created_at: new Date().toISOString(),
      selesai_at: null,
    };
    db.layanan.unshift(created);
    writeDb(db);
    res.status(201).json(enrichLayanan(created, db.dokumen));
  });

  // Request approval code for Fungsional Madya
  app.post("/api/layanan/:id/kode-persetujuan", async (req, res) => {
    const db = readDb();
    const item = db.layanan.find((l) => l.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: "Layanan tidak ditemukan" });
      return;
    }

    const code = String(crypto.randomInt(100000, 999999));
    const now = Date.now();
    if (!db.approval_codes) db.approval_codes = {};
    db.approval_codes[item.id] = {
      code,
      recipient_email: MADYA_REGISTERED_EMAIL,
      created_at: now,
      expires_at: now + APPROVAL_TTL_MS,
    };
    writeDb(db);

    const delivery = await dispatchApprovalEmail(
      MADYA_REGISTERED_EMAIL,
      code,
      item.no_layanan,
      item.pemohon,
    );

    res.json({
      sent_to: MADYA_REGISTERED_EMAIL,
      masked_email: maskEmail(MADYA_REGISTERED_EMAIL),
      expires_in_seconds: Math.floor(APPROVAL_TTL_MS / 1000),
      delivery_mode: delivery.mode,
      ...(delivery.mode === "simulasi" ? { preview_code: code } : {}),
    });
  });

  // Verify approval code before enabling Save & Print
  app.post("/api/layanan/:id/verifikasi-kode", (req, res) => {
    const db = readDb();
    const item = db.layanan.find((l) => l.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: "Layanan tidak ditemukan" });
      return;
    }
    const result = verifyApprovalCode(db, item.id, String(req.body?.code || ""));
    res.json({ valid: result.valid, message: result.reason });
  });

  // Save or update Berita Acara (requires valid Fungsional Madya approval code)
  app.put("/api/layanan/:id/ba", (req, res) => {
    const db = readDb();
    const idx = db.layanan.findIndex((l) => l.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: "Layanan tidak ditemukan" });
      return;
    }
    const b = req.body ?? {};
    const verification = verifyApprovalCode(db, req.params.id, String(b.approval_code || ""));
    if (!verification.valid) {
      res.status(403).json({ error: verification.reason });
      return;
    }

    const now = new Date().toISOString();
    const item = db.layanan[idx];
    const prevBa = item.ba;
    const lockedNomorBa = item.nomor_ba || prevBa?.nomor_ba || `W15.BHP.02-${item.no_layanan}`;
    db.layanan[idx].ba = {
      nomor_ba: lockedNomorBa,
      ada_surat_kuasa: Boolean(b.ada_surat_kuasa),
      tanggal_surat_kuasa: b.ada_surat_kuasa ? String(b.tanggal_surat_kuasa || "") : "",
      hari: String(b.hari || ""),
      tanggal: String(b.tanggal || ""),
      tempat_dibuat: String(b.tempat_dibuat || "Sidoarjo"),
      pihak_pertama_nama: String(b.pihak_pertama_nama || ""),
      pihak_pertama_nip: String(b.pihak_pertama_nip || ""),
      pihak_pertama_jabatan: String(b.pihak_pertama_jabatan || ""),
      pihak_kedua_nama: String(b.pihak_kedua_nama || ""),
      pihak_kedua_jabatan: String(b.pihak_kedua_jabatan || ""),
      pihak_kedua_alamat: String(b.pihak_kedua_alamat || ""),
      deskripsi_wasiat: String(b.deskripsi_wasiat || ""),
      nama_pewasiat: String(b.nama_pewasiat || ""),
      saksi_1: String(b.saksi_1 || ""),
      saksi_2: String(b.saksi_2 || ""),
      created_at: prevBa?.created_at ?? now,
      updated_at: now,
    };

    if (db.approval_codes) {
      delete db.approval_codes[req.params.id];
    }

    writeDb(db);
    res.json(enrichLayanan(db.layanan[idx], db.dokumen));
  });

  // Complete layanan -> archive to history
  app.post("/api/layanan/:id/selesai", (req, res) => {
    const db = readDb();
    const idx = db.layanan.findIndex((l) => l.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: "Layanan tidak ditemukan" });
      return;
    }
    db.layanan[idx].status = "selesai";
    db.layanan[idx].selesai_at = new Date().toISOString();
    writeDb(db);
    res.json(enrichLayanan(db.layanan[idx], db.dokumen));
  });

  // Reopen layanan from history
  app.post("/api/layanan/:id/aktifkan", (req, res) => {
    const db = readDb();
    const idx = db.layanan.findIndex((l) => l.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: "Layanan tidak ditemukan" });
      return;
    }
    db.layanan[idx].status = "aktif";
    db.layanan[idx].selesai_at = null;
    writeDb(db);
    res.json(enrichLayanan(db.layanan[idx], db.dokumen));
  });

  // Delete layanan
  app.delete("/api/layanan/:id", (req, res) => {
    const db = readDb();
    const exists = db.layanan.some((l) => l.id === req.params.id);
    if (!exists) {
      res.status(404).json({ error: "Layanan tidak ditemukan" });
      return;
    }
    const docsToRemove = db.dokumen.filter((d) => d.layanan_id === req.params.id);
    for (const d of docsToRemove) {
      const p = path.join(UPLOADS_DIR, d.stored_name);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    db.dokumen = db.dokumen.filter((d) => d.layanan_id !== req.params.id);
    db.layanan = db.layanan.filter((l) => l.id !== req.params.id);
    writeDb(db);
    res.status(204).end();
  });

  // List dokumen for layanan
  app.get("/api/layanan/:id/dokumen", (req, res) => {
    const db = readDb();
    const docs = db.dokumen
      .filter((d) => d.layanan_id === req.params.id)
      .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at))
      .map(({ stored_name: _s, ...pub }) => pub);
    res.json(docs);
  });

  // Upload dokumen
  app.post("/api/layanan/:id/dokumen", upload.single("file"), (req, res) => {
    const db = readDb();
    const item = db.layanan.find((l) => l.id === req.params.id);
    if (!item) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(404).json({ error: "Layanan tidak ditemukan" });
      return;
    }
    if (item.dokumen_terkunci) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(403).json({
        error: "Dokumen sudah disimpan permanen dan dikunci. Tidak dapat menambah berkas lagi.",
      });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "Berkas tidak ditemukan pada permintaan unggah" });
      return;
    }
    const jenis = String(req.body?.jenis || "dokumentasi") as DokumenJenis;
    const record: DokumenRecord = {
      id: crypto.randomUUID(),
      layanan_id: req.params.id,
      jenis,
      filename: req.file.originalname,
      stored_name: req.file.filename,
      mime_type: req.file.mimetype || "application/octet-stream",
      size: req.file.size,
      uploaded_at: new Date().toISOString(),
    };
    db.dokumen.push(record);
    writeDb(db);
    const { stored_name: _s, ...pub } = record;
    res.status(201).json(pub);
  });

  // Finalize & lock all uploaded dokumen
  app.post("/api/layanan/:id/dokumen/simpan", (req, res) => {
    const db = readDb();
    const idx = db.layanan.findIndex((l) => l.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: "Layanan tidak ditemukan" });
      return;
    }
    const item = db.layanan[idx];
    if (item.dokumen_terkunci) {
      if (item.status !== "selesai") {
        item.status = "selesai";
        item.selesai_at = item.selesai_at ?? new Date().toISOString();
        writeDb(db);
      }
      res.json(enrichLayanan(item, db.dokumen));
      return;
    }

    const requiredSlots = getRequiredSlots(item);
    const uploadedKinds = new Set(db.dokumen.filter((d) => d.layanan_id === item.id).map((d) => d.jenis));
    const missingSlots = requiredSlots.filter((slot) => !uploadedKinds.has(slot));

    if (missingSlots.length > 0) {
      const missingNames = missingSlots.map((slot) => SLOT_LABELS[slot]).join(", ");
      res.status(400).json({
        error: `Dokumen belum lengkap. Harap unggah terlebih dahulu: ${missingNames}.`,
        missing_slots: missingSlots,
      });
      return;
    }

    const nowIso = new Date().toISOString();
    item.dokumen_terkunci = true;
    item.dokumen_dikunci_at = nowIso;
    item.status = "selesai";
    item.selesai_at = item.selesai_at ?? nowIso;
    writeDb(db);
    res.json(enrichLayanan(item, db.dokumen));
  });

  // Download or inline preview dokumen
  app.get("/api/dokumen/:dokId/unduh", (req, res) => {
    const db = readDb();
    const dok = db.dokumen.find((d) => d.id === req.params.dokId);
    if (!dok) {
      res.status(404).json({ error: "Dokumen tidak ditemukan" });
      return;
    }
    const filePath = path.join(UPLOADS_DIR, dok.stored_name);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Berkas fisik tidak tersedia di penyimpanan" });
      return;
    }
    res.setHeader("Content-Type", dok.mime_type);
    const disposition = req.query.inline === "1" ? "inline" : "attachment";
    res.setHeader("Content-Disposition", `${disposition}; filename="${encodeURIComponent(dok.filename)}"`);
    fs.createReadStream(filePath).pipe(res);
  });

  // Delete dokumen
  app.delete("/api/dokumen/:dokId", (req, res) => {
    const db = readDb();
    const idx = db.dokumen.findIndex((d) => d.id === req.params.dokId);
    if (idx === -1) {
      res.status(404).json({ error: "Dokumen tidak ditemukan" });
      return;
    }
    const targetDoc = db.dokumen[idx];
    const parentLayanan = db.layanan.find((l) => l.id === targetDoc.layanan_id);
    if (parentLayanan?.dokumen_terkunci) {
      res.status(403).json({
        error: "Dokumen sudah disimpan permanen dan dikunci. Berkas tidak dapat diubah atau dihapus.",
      });
      return;
    }
    const [removed] = db.dokumen.splice(idx, 1);
    const filePath = path.join(UPLOADS_DIR, removed.stored_name);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    writeDb(db);
    res.status(204).end();
  });

  if (process.env.NODE_ENV === "production") {
    const distDir = path.resolve(process.cwd(), "dist");
    app.use(express.static(distDir));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Madya server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
