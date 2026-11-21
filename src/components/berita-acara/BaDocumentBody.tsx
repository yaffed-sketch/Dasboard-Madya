import { bagianTanggal, formatTanggal } from "@/lib/format";
import type { BaForm } from "@/lib/types";

interface BaDocumentBodyProps {
  value: BaForm;
}

export default function BaDocumentBody({ value }: BaDocumentBodyProps) {
  const parts = bagianTanggal(value.tanggal);
  const tglSuratKuasa = value.tanggal_surat_kuasa ? formatTanggal(value.tanggal_surat_kuasa) : "……";

  return (
    <article className="font-serif text-[12.5px] leading-[1.6] text-slate-950">
      {/* Kop Surat Resmi Kementerian Hukum / BHP Surabaya — spasi rapat (1.0) */}
      <header className="flex items-center gap-3.5 pb-1.5">
        <img
          src="/assets/aistudio/image_9c64760d.png"
          alt="Logo Resmi Kementerian Hukum Republik Indonesia"
          referrerPolicy="no-referrer"
          className="size-[62px] shrink-0 object-contain"
        />
        <div className="flex-1 text-center leading-[1.15]">
          <p className="font-sans text-[12px] font-medium uppercase tracking-[0.03em] text-slate-900">
            Kementerian Hukum Republik Indonesia
          </p>
          <p className="font-sans text-[13.5px] font-bold uppercase tracking-[0.02em] text-slate-950">
            Balai Harta Peninggalan Surabaya
          </p>
          <p className="font-sans text-[10px] text-slate-800">
            Jalan Jenderal S. Parman No. 58, Waru, Sidoarjo
          </p>
          <p className="font-sans text-[10px] text-slate-800">
            Telepon (031) 8531785
          </p>
          <p className="font-sans text-[10px] text-slate-800">
            Laman:{" "}
            <span className="text-blue-800 underline">http://bhpsurabaya.kemenkum.go.id</span>, Pos-el:{" "}
            <span className="text-blue-800 underline">bhp.surabaya@kemenkum.go.id</span>
          </p>
        </div>
      </header>

      <div className="border-b-2 border-blue-950" />
      <div className="mt-[2px] border-b border-blue-950" />

      {/* Judul Dokumen */}
      <div className="mt-4 text-center font-sans leading-snug">
        <h2 className="text-[14px] font-bold uppercase tracking-wide text-slate-950">Berita Acara</h2>
        <p className="text-[13px] font-bold uppercase tracking-wide text-slate-950">
          Pembukaan dan Pembacaan Wasiat Tertutup/Rahasia
        </p>
        <p className="text-[12.5px] font-bold text-slate-950">
          NOMOR: <span className="font-mono">{value.nomor_ba || "…"}</span>
        </p>
      </div>

      {/* Paragraf Pembuka */}
      <p className="mt-4 text-justify indent-8">
        Sesuai dengan Pasal 942 Kitab Undang-Undang Hukum Perdata <em>jo.</em> Pasal 14 Huruf d Peraturan Menteri Hukum
        Nomor 16 Tahun 2026 Tentang Organisasi dan Tata Kerja di Lingkungan Kementerian Hukum
        {value.ada_surat_kuasa && (
          <>
            {" "}
            dan surat kuasa tgl <span className="font-semibold">{tglSuratKuasa}</span>
          </>
        )}
        . Pada hari ini, <span className="font-semibold">{value.hari || "……"}</span>, tanggal{" "}
        <span className="font-semibold tabular-nums">{parts.tanggal}</span>, bulan{" "}
        <span className="font-semibold">{parts.bulan}</span>, tahun{" "}
        <span className="font-semibold tabular-nums">{parts.tahun}</span>, Kami masing-masing:
      </p>

      {/* PIHAK PERTAMA */}
      <div className="mt-3 pl-6">
        <table className="w-full border-collapse text-left">
          <tbody>
            <tr>
              <td className="w-32 py-0.5 text-slate-700">Nama Pejabat</td>
              <td className="w-3 py-0.5">:</td>
              <td className="py-0.5 font-semibold">{value.pihak_pertama_nama || "…"}</td>
            </tr>
            <tr>
              <td className="py-0.5 text-slate-700">NIP</td>
              <td className="py-0.5">:</td>
              <td className="py-0.5 font-mono text-[12px] tabular-nums">
                {value.pihak_pertama_nip?.trim() || "…"}
              </td>
            </tr>
            <tr>
              <td className="py-0.5 text-slate-700">Jabatan</td>
              <td className="py-0.5">:</td>
              <td className="py-0.5">{value.pihak_pertama_jabatan || "…"}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-1">
          selanjutnya disebut <span className="font-semibold">PIHAK PERTAMA</span>
        </p>
      </div>

      <p className="my-2 text-center font-medium">Dan</p>

      {/* PIHAK KEDUA */}
      <div className="pl-6">
        <table className="w-full border-collapse text-left">
          <tbody>
            <tr>
              <td className="w-32 py-0.5 text-slate-700">Nama Pemohon</td>
              <td className="w-3 py-0.5">:</td>
              <td className="py-0.5 font-semibold">{value.pihak_kedua_nama || "…"}</td>
            </tr>
            <tr>
              <td className="py-0.5 text-slate-700">Jabatan Pemohon</td>
              <td className="py-0.5">:</td>
              <td className="py-0.5">{value.pihak_kedua_jabatan || "…"}</td>
            </tr>
            <tr className="align-top">
              <td className="py-0.5 text-slate-700">Alamat Pemohon</td>
              <td className="py-0.5">:</td>
              <td className="py-0.5">{value.pihak_kedua_alamat || "…"}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-1">
          selanjutnya disebut <span className="font-semibold">PIHAK KEDUA</span>
        </p>
      </div>

      {/* Isi Poin 1-3 */}
      <p className="mt-3">Telah melaksanakan hal-hal sebagai berikut:</p>

      <ol className="mt-2 list-decimal space-y-2 pl-8 text-justify">
        <li>
          PIHAK KEDUA telah menyerahkan kepada PIHAK PERTAMA, berupa{" "}
          <span className="font-semibold">
            {value.deskripsi_wasiat || "(deskripsi tampilan akta wasiat tertutup/rahasia)"}
          </span>{" "}
          yang berisi akta wasiat tertutup/rahasia yang dibuat dan diserahkan untuk disimpan Notaris penyimpan oleh{" "}
          <span className="font-semibold">{value.nama_pewasiat || "(nama Pewasiat)"}</span>;
        </li>
        <li>
          PIHAK PERTAMA membuka penyimpanan akta wasiat tertutup/rahasia tersebut dan telah membacakan isi akta wasiat
          tertutup/rahasia tersebut di hadapan PIHAK KEDUA, para ahli waris Pewasiat, dan para saksi (akta wasiat
          tertutup/rahasia terlampir); dan
        </li>
        <li>
          PIHAK PERTAMA telah mengembalikan akta wasiat tertutup/rahasia tersebut kepada PIHAK KEDUA untuk kemudian
          dilakukan pendaftaran wasiat tercatat ke Balai Harta Peninggalan Surabaya sebelum pelaksanaan isi wasiat
          tersebut.
        </li>
      </ol>

      <p className="mt-4 text-justify indent-8">
        Berita acara ini dibuat dengan sesungguhnya dalam 2 (dua) rangkap yang sama dan ditandatangani oleh kedua pihak
        pada hari tanggal tersebut di atas untuk dapat dipergunakan sebagaimana mestinya.
      </p>

      {/* Blok Tanda Tangan Pihak Kedua & Pihak Pertama (tanpa jabatan/NIP berulang) */}
      <div className="mt-7 grid grid-cols-2 gap-8">
        <div>
          <p className="font-semibold">&nbsp;</p>
          <p className="font-semibold">PIHAK KEDUA,</p>
          <div className="h-16" />
          <p className="font-semibold underline underline-offset-4">
            {value.pihak_kedua_nama || "……………"}
          </p>
        </div>

        <div>
          <p>
            Dibuat di <span className="font-semibold">{value.tempat_dibuat || "…"}</span>
          </p>
          <p className="font-semibold">PIHAK PERTAMA,</p>
          <div className="h-16" />
          <p className="font-semibold underline underline-offset-4">
            {value.pihak_pertama_nama || "……………"}
          </p>
        </div>
      </div>

      {/* Saksi-saksi (cukup 2 saksi) */}
      <div className="mt-7">
        <p className="font-semibold">Saksi-saksi</p>
        <div className="mt-2 space-y-3">
          {[value.saksi_1, value.saksi_2].map((saksi, idx) => (
            <div key={idx} className="grid grid-cols-2 items-end gap-8">
              <div className="flex items-baseline gap-2">
                <span className="w-4 tabular-nums">{idx + 1}.</span>
                <span className="flex-1 border-b border-dotted border-slate-500 pb-0.5">
                  {saksi || ""}
                </span>
              </div>
              <div className="border-b border-dotted border-slate-500 pb-0.5">&nbsp;</div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
