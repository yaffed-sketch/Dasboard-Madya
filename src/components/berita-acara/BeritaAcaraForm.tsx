import type { FormEvent } from "react";
import { AlertCircle, CheckCircle2, Download, KeyRound, Mail, Printer, ShieldCheck } from "lucide-react";
import type { ApprovalCodeRequestResponse, BaForm } from "@/lib/types";

interface BeritaAcaraFormProps {
  noLayanan: string;
  value: BaForm;
  onChange: (patch: Partial<BaForm>) => void;
  onToggleSuratKuasa: (adaSuratKuasa: boolean) => void;
  onSaveAndPrint: () => void;
  onSaveAndDownload: () => void;
  savingMode: "print" | "download" | null;
  approvalCode: string;
  onApprovalCodeChange: (code: string) => void;
  onRequestApprovalCode: () => void;
  requestingCode: boolean;
  cooldownSeconds: number;
  codeDispatchInfo: ApprovalCodeRequestResponse | null;
  codeVerification: {
    status: "idle" | "checking" | "valid" | "invalid";
    message: string;
  };
}

const inputCls =
  "mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15";

const labelCls = "block text-xs font-medium text-slate-700";

export default function BeritaAcaraForm({
  noLayanan,
  value,
  onChange,
  onToggleSuratKuasa,
  onSaveAndPrint,
  onSaveAndDownload,
  savingMode,
  approvalCode,
  onApprovalCodeChange,
  onRequestApprovalCode,
  requestingCode,
  cooldownSeconds,
  codeDispatchInfo,
  codeVerification,
}: BeritaAcaraFormProps) {
  const isVerified = codeVerification.status === "valid";
  const isBusy = savingMode !== null;
  const canSubmit = isVerified && !isBusy;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSaveAndPrint();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col divide-y divide-slate-200">
      {/* Detail Dokumen & Status Surat Kuasa */}
      <section className="pb-6">
        <h3 className="font-heading text-sm font-semibold text-slate-900">
          Detail Berita Acara & Waktu
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Nomor layanan sistem, nomor dokumen e-Office Ditjen AHU, status surat kuasa, dan jadwal pelaksanaan.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="ba-no-layanan" className={labelCls}>
              Nomor Layanan (Otomatis)
            </label>
            <input
              id="ba-no-layanan"
              type="text"
              disabled
              readOnly
              value={noLayanan}
              className="mt-1.5 block w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 font-mono text-sm text-slate-500 select-all"
            />
            <p className="mt-1 text-xs text-slate-500">
              Terisi otomatis dari sistem layanan (hasil verifikasi Fungsional Muda) dan tidak dapat diubah.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="ba-nomor" className={labelCls}>
              Nomor Dokumen Berita Acara (e-Office Ditjen AHU)
            </label>
            <input
              id="ba-nomor"
              type="text"
              disabled
              readOnly
              value={value.nomor_ba}
              className="mt-1.5 block w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 font-mono text-sm text-slate-500 select-all"
            />
            <p className="mt-1 text-xs text-slate-500">
              Diambil otomatis dari e-Office resmi Ditjen AHU dan terkunci (berbeda dengan nomor layanan).
            </p>
          </div>

          <div className="sm:col-span-2">
            <span className={labelCls}>Status Surat Kuasa (Menentukan Pihak Pertama Otomatis)</span>
            <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => onToggleSuratKuasa(false)}
                className={`h-9 rounded-md px-3 text-xs font-medium transition-colors ${
                  !value.ada_surat_kuasa ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tidak Ada Surat Kuasa
              </button>
              <button
                type="button"
                onClick={() => onToggleSuratKuasa(true)}
                className={`h-9 rounded-md px-3 text-xs font-medium transition-colors ${
                  value.ada_surat_kuasa ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Ada Surat Kuasa
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              {value.ada_surat_kuasa
                ? "Pihak Pertama otomatis menggunakan pejabat penerima kuasa dari verifikasi Fungsional Muda."
                : "Tanpa surat kuasa: Pihak Pertama otomatis Kepala Balai Harta Peninggalan Surabaya."}
            </p>
          </div>

          {value.ada_surat_kuasa && (
            <div>
              <label htmlFor="ba-tgl-kuasa" className={labelCls}>
                Tanggal Surat Kuasa
              </label>
              <input
                id="ba-tgl-kuasa"
                type="date"
                required
                value={value.tanggal_surat_kuasa}
                onChange={(e) => onChange({ tanggal_surat_kuasa: e.target.value })}
                className={`${inputCls} tabular-nums`}
              />
            </div>
          )}

          <div className={value.ada_surat_kuasa ? "" : "sm:col-span-2"}>
            <label htmlFor="ba-tempat-dibuat" className={labelCls}>
              Dibuat di (Kota/Lokasi)
            </label>
            <input
              id="ba-tempat-dibuat"
              type="text"
              required
              placeholder="Sidoarjo"
              value={value.tempat_dibuat}
              onChange={(e) => onChange({ tempat_dibuat: e.target.value })}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="ba-tanggal" className={labelCls}>
              Tanggal Pembukaan
            </label>
            <input
              id="ba-tanggal"
              type="date"
              required
              value={value.tanggal}
              onChange={(e) => onChange({ tanggal: e.target.value })}
              className={`${inputCls} tabular-nums`}
            />
          </div>

          <div>
            <label htmlFor="ba-hari" className={labelCls}>
              Hari (Otomatis)
            </label>
            <input
              id="ba-hari"
              type="text"
              required
              value={value.hari}
              onChange={(e) => onChange({ hari: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* PIHAK PERTAMA — Otomatis sesuai Surat Kuasa */}
      <section className="py-6">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-heading text-sm font-semibold text-slate-900">Pihak Pertama (Otomatis)</h3>
          <span className="text-xs text-slate-500">
            {value.ada_surat_kuasa ? "Penerima Kuasa (Verifikasi Muda)" : "Kepala BHP Surabaya"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="ba-p1-nama" className={labelCls}>
              Nama Pejabat
            </label>
            <input
              id="ba-p1-nama"
              type="text"
              required
              value={value.pihak_pertama_nama}
              onChange={(e) => onChange({ pihak_pertama_nama: e.target.value })}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="ba-p1-nip" className={labelCls}>
              NIP
            </label>
            <input
              id="ba-p1-nip"
              type="text"
              required
              placeholder="18 digit NIP"
              value={value.pihak_pertama_nip}
              onChange={(e) => onChange({ pihak_pertama_nip: e.target.value })}
              className={`${inputCls} font-mono tabular-nums`}
            />
          </div>

          <div>
            <label htmlFor="ba-p1-jabatan" className={labelCls}>
              Jabatan
            </label>
            <input
              id="ba-p1-jabatan"
              type="text"
              required
              value={value.pihak_pertama_jabatan}
              onChange={(e) => onChange({ pihak_pertama_jabatan: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* PIHAK KEDUA — Pemohon */}
      <section className="py-6">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-heading text-sm font-semibold text-slate-900">Pihak Kedua (Pemohon)</h3>
          <span className="text-xs text-slate-500">Notaris Penyimpan / Kuasa</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ba-p2-nama" className={labelCls}>
              Nama Pemohon
            </label>
            <input
              id="ba-p2-nama"
              type="text"
              required
              value={value.pihak_kedua_nama}
              onChange={(e) => onChange({ pihak_kedua_nama: e.target.value })}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="ba-p2-jabatan" className={labelCls}>
              Jabatan Pemohon
            </label>
            <input
              id="ba-p2-jabatan"
              type="text"
              required
              placeholder="Contoh: Notaris Kota Surabaya"
              value={value.pihak_kedua_jabatan}
              onChange={(e) => onChange({ pihak_kedua_jabatan: e.target.value })}
              className={inputCls}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="ba-p2-alamat" className={labelCls}>
              Alamat Pemohon
            </label>
            <textarea
              id="ba-p2-alamat"
              rows={2}
              required
              value={value.pihak_kedua_alamat}
              onChange={(e) => onChange({ pihak_kedua_alamat: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* Deskripsi Wasiat Tertutup & Pewasiat (Poin 1) */}
      <section className="py-6">
        <h3 className="font-heading text-sm font-semibold text-slate-900">
          Keterangan Akta Wasiat (Poin 1)
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Deskripsi fisik bundel wasiat yang diserahkan serta identitas Pewasiat.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="ba-nama-pewasiat" className={labelCls}>
              Nama Pewasiat
            </label>
            <input
              id="ba-nama-pewasiat"
              type="text"
              required
              placeholder="Nama lengkap pembuat wasiat tertutup"
              value={value.nama_pewasiat}
              onChange={(e) => onChange({ nama_pewasiat: e.target.value })}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="ba-deskripsi-wasiat" className={labelCls}>
              Deskripsi Tampilan Akta Wasiat Tertutup/Rahasia
            </label>
            <textarea
              id="ba-deskripsi-wasiat"
              rows={2}
              required
              placeholder="Contoh: dalam amplop coklat ukuran A4 dalam keadaan tertutup dan tersegel"
              value={value.deskripsi_wasiat}
              onChange={(e) => onChange({ deskripsi_wasiat: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* Saksi-saksi (2 saksi) */}
      <section className="py-6">
        <h3 className="font-heading text-sm font-semibold text-slate-900">Saksi-saksi</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Dua (2) orang saksi yang menghadiri pembukaan dan pembacaan wasiat tertutup.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="ba-saksi-1" className={labelCls}>
              Saksi 1
            </label>
            <input
              id="ba-saksi-1"
              type="text"
              placeholder="Nama lengkap Saksi 1"
              value={value.saksi_1}
              onChange={(e) => onChange({ saksi_1: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="ba-saksi-2" className={labelCls}>
              Saksi 2
            </label>
            <input
              id="ba-saksi-2"
              type="text"
              placeholder="Nama lengkap Saksi 2"
              value={value.saksi_2}
              onChange={(e) => onChange({ saksi_2: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* Otorisasi & Kode Persetujuan Fungsional Madya */}
      <section className="py-6">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-blue-600" />
          <div>
            <h3 className="font-heading text-sm font-semibold text-slate-900">
              Otorisasi Fungsional Madya
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              Pesan kode persetujuan yang dikirim ke email Fungsional Madya terdaftar, lalu masukkan kode 6 digit untuk
              mengaktifkan tombol Simpan & Download maupun Simpan & Cetak.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="ba-kode-persetujuan" className={labelCls}>
            Masukkan Kode Persetujuan
          </label>
          <div className="relative mt-1.5">
            <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              id="ba-kode-persetujuan"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="Masukkan 6 digit kode persetujuan"
              value={approvalCode}
              onChange={(e) => onApprovalCodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="block w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-3 pl-9 font-mono text-sm tracking-[0.2em] text-slate-900 tabular-nums placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
            />
          </div>

          <div className="mt-2 min-h-[20px] text-xs">
            {codeVerification.status === "checking" && (
              <span className="text-slate-500">Memeriksa kode persetujuan…</span>
            )}
            {codeVerification.status === "valid" && (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                <CheckCircle2 className="size-3.5 shrink-0" />
                <span>{codeVerification.message}</span>
              </span>
            )}
            {codeVerification.status === "invalid" && (
              <span className="inline-flex items-center gap-1.5 font-medium text-red-700">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{codeVerification.message}</span>
              </span>
            )}
            {codeVerification.status === "idle" && (
              <span className="text-slate-500">
                {codeDispatchInfo
                  ? `Kode dikirim ke ${codeDispatchInfo.masked_email}. Masukkan 6 digit di atas.`
                  : "Tombol Simpan & Download serta Simpan & Cetak terkunci hingga kode persetujuan terverifikasi."}
              </span>
            )}
          </div>

          {codeDispatchInfo && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900">
                  Email dikirim ke {codeDispatchInfo.sent_to}
                </span>
                <span className="text-slate-500 tabular-nums">Berlaku 10 menit</span>
              </div>
              {codeDispatchInfo.delivery_mode === "simulasi" && codeDispatchInfo.preview_code && (
                <p className="mt-1.5 text-slate-600">
                  Pratinjau Kotak Masuk Madya — Kode Persetujuan:{" "}
                  <span className="font-mono font-bold tracking-wider text-slate-950 tabular-nums">
                    {codeDispatchInfo.preview_code}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col gap-2.5 pt-6">
        <button
          type="button"
          disabled={requestingCode || cooldownSeconds > 0}
          onClick={onRequestApprovalCode}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
        >
          <Mail className="size-4 text-blue-600" />
          <span>
            {requestingCode
              ? "Mengirim Kode…"
              : cooldownSeconds > 0
                ? `Pesan Kode Persetujuan (${cooldownSeconds}d)`
                : "Pesan Kode Persetujuan"}
          </span>
        </button>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit) return;
              onSaveAndDownload();
            }}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors whitespace-nowrap ${
              canSubmit
                ? "border border-blue-600 bg-white text-blue-700 hover:bg-blue-50"
                : "cursor-not-allowed border border-slate-200 bg-slate-200 text-slate-400"
            }`}
          >
            <Download className="size-4" />
            <span>{savingMode === "download" ? "Mengunduh…" : "Simpan & Download"}</span>
          </button>

          <button
            type="submit"
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors whitespace-nowrap ${
              canSubmit
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "cursor-not-allowed border border-slate-200 bg-slate-200 text-slate-400"
            }`}
          >
            <Printer className="size-4" />
            <span>{savingMode === "print" ? "Menyimpan…" : "Simpan & Cetak 2 Salinan"}</span>
          </button>
        </div>

        <p className="text-[11px] leading-relaxed text-slate-500">
          Gunakan <span className="font-medium text-slate-700">Simpan & Download</span> untuk mengunduh PDF 2 salinan
          siap kirim via WhatsApp atau Email bila perangkat belum terhubung dengan printer.
        </p>
      </div>
    </form>
  );
}
