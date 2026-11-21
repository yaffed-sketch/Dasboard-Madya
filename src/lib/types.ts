export type StatusLayanan = "aktif" | "selesai";

export type StatusSla = "aman" | "peringatan" | "kritis";

export type DokumenJenis =
  | "persetujuan_jadwal"
  | "surat_kuasa"
  | "daftar_hadir"
  | "berita_acara"
  | "wasiat_tertutup"
  | "dokumentasi";

export interface BaForm {
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
  created_at?: string;
  updated_at?: string;
}

export interface Dokumen {
  id: string;
  layanan_id: string;
  jenis: DokumenJenis;
  filename: string;
  mime_type: string;
  size: number;
  uploaded_at: string;
}

export interface Layanan {
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
  ba: BaForm | null;
  created_at: string;
  selesai_at: string | null;
  sisa_hari: number;
  status_sla: StatusSla;
  dokumen_terkunci?: boolean;
  dokumen_dikunci_at?: string | null;
  dokumen_wajib_count?: number;
  dokumen_wajib_total?: number;
  dokumen_total_count?: number;
}

export interface CreateLayananPayload {
  no_layanan: string;
  jenis_layanan: string;
  pemohon: string;
  pemohon_nik: string;
  pemohon_jabatan?: string;
  pemohon_alamat: string;
  pihak_kedua_nama: string;
  pihak_kedua_nik: string;
  pihak_kedua_alamat: string;
  pihak_kedua_peran: string;
  tenggat: string;
  jadwal_pembukaan: string;
  jam_pembukaan: string;
  tempat: string;
  notaris_nama: string;
  notaris_sk: string;
}

export interface ApprovalCodeRequestResponse {
  sent_to: string;
  masked_email: string;
  expires_in_seconds: number;
  delivery_mode: "resend" | "simulasi";
  preview_code?: string;
}

export interface ApprovalCodeVerifyResponse {
  valid: boolean;
  message: string;
}
