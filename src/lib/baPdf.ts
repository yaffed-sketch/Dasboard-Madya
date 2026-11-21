import { jsPDF } from "jspdf";
import { bagianTanggal, formatTanggal } from "@/lib/format";
import type { BaForm } from "@/lib/types";

async function loadImageDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawKeyValueRow(
  doc: jsPDF,
  label: string,
  val: string,
  y: number,
  options?: { boldValue?: boolean }
): number {
  const labelX = 28;
  const colonX = 63;
  const valueX = 66;
  const maxValWidth = 124;

  doc.setFont("times", "normal");
  doc.setFontSize(10.5);
  doc.text(label, labelX, y);
  doc.text(":", colonX, y);

  doc.setFont("times", options?.boldValue ? "bold" : "normal");
  const lines = doc.splitTextToSize(val || "…", maxValWidth) as string[];
  doc.text(lines, valueX, y);
  return y + lines.length * 4.7;
}

function drawCopyPage(doc: jsPDF, value: BaForm, copy: 1 | 2, logoDataUrl: string | null) {
  const parts = bagianTanggal(value.tanggal);
  const tglSuratKuasa = value.tanggal_surat_kuasa ? formatTanggal(value.tanggal_surat_kuasa) : "……";
  const copyLabel = copy === 1 ? "CETAKAN 1 — PIHAK PERTAMA" : "CETAKAN 2 — PIHAK KEDUA";

  // Label salinan di kanan atas
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(copyLabel, 190, 13, { align: "right" });

  // Logo resmi Kementerian Hukum
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 20, 17.5, 17.5, 17.5);
  }

  // Kop Surat (spasi rapat)
  const kopCenterX = logoDataUrl ? 113 : 105;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text("KEMENTERIAN HUKUM REPUBLIK INDONESIA", kopCenterX, 20.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("BALAI HARTA PENINGGALAN SURABAYA", kopCenterX, 24.7, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("Jalan Jenderal S. Parman No. 58, Waru, Sidoarjo", kopCenterX, 28.4, { align: "center" });
  doc.text("Telepon (031) 8531785", kopCenterX, 31.8, { align: "center" });
  doc.text("Laman: http://bhpsurabaya.kemenkum.go.id, Pos-el: bhp.surabaya@kemenkum.go.id", kopCenterX, 35.2, {
    align: "center",
  });

  // Garis ganda pemisah Kop Surat
  doc.setDrawColor(23, 37, 84);
  doc.setLineWidth(0.65);
  doc.line(20, 37.8, 190, 37.8);
  doc.setLineWidth(0.25);
  doc.line(20, 38.9, 190, 38.9);

  // Judul Dokumen
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("BERITA ACARA", 105, 45.5, { align: "center" });
  doc.setFontSize(10.2);
  doc.text("PEMBUKAAN DAN PEMBACAAN WASIAT TERTUTUP/RAHASIA", 105, 50.2, { align: "center" });
  doc.setFontSize(10);
  doc.text(`NOMOR: ${value.nomor_ba || "…"}`, 105, 54.9, { align: "center" });

  let y = 62.5;
  doc.setFont("times", "normal");
  doc.setFontSize(10.5);

  // Paragraf Pembuka
  const kuasaClause = value.ada_surat_kuasa ? ` dan surat kuasa tgl ${tglSuratKuasa}` : "";
  const openingText = `        Sesuai dengan Pasal 942 Kitab Undang-Undang Hukum Perdata jo. Pasal 14 Huruf d Peraturan Menteri Hukum Nomor 16 Tahun 2026 Tentang Organisasi dan Tata Kerja di Lingkungan Kementerian Hukum${kuasaClause}. Pada hari ini, ${value.hari || "……"}, tanggal ${parts.tanggal}, bulan ${parts.bulan}, tahun ${parts.tahun}, Kami masing-masing:`;
  const openingLines = doc.splitTextToSize(openingText, 170) as string[];
  doc.text(openingText, 20, y, { maxWidth: 170, align: "justify", lineHeightFactor: 1.32 });
  y += openingLines.length * 4.7 + 2.5;

  // PIHAK PERTAMA
  y = drawKeyValueRow(doc, "Nama Pejabat", value.pihak_pertama_nama, y, { boldValue: true });
  y = drawKeyValueRow(doc, "NIP", value.pihak_pertama_nip.trim(), y);
  y = drawKeyValueRow(doc, "Jabatan", value.pihak_pertama_jabatan, y);
  doc.setFont("times", "normal");
  doc.text("selanjutnya disebut ", 28, y + 0.5);
  const p1PrefixW = doc.getTextWidth("selanjutnya disebut ");
  doc.setFont("times", "bold");
  doc.text("PIHAK PERTAMA", 28 + p1PrefixW, y + 0.5);
  y += 6.5;

  // Dan
  doc.setFont("times", "normal");
  doc.text("Dan", 105, y, { align: "center" });
  y += 5.5;

  // PIHAK KEDUA
  y = drawKeyValueRow(doc, "Nama Pemohon", value.pihak_kedua_nama, y, { boldValue: true });
  y = drawKeyValueRow(doc, "Jabatan Pemohon", value.pihak_kedua_jabatan, y);
  y = drawKeyValueRow(doc, "Alamat Pemohon", value.pihak_kedua_alamat, y);
  doc.setFont("times", "normal");
  doc.text("selanjutnya disebut ", 28, y + 0.5);
  const p2PrefixW = doc.getTextWidth("selanjutnya disebut ");
  doc.setFont("times", "bold");
  doc.text("PIHAK KEDUA", 28 + p2PrefixW, y + 0.5);
  y += 7;

  // Isi Poin 1-3
  doc.setFont("times", "normal");
  doc.text("Telah melaksanakan hal-hal sebagai berikut:", 20, y);
  y += 5.5;

  const points = [
    `PIHAK KEDUA telah menyerahkan kepada PIHAK PERTAMA, berupa ${value.deskripsi_wasiat || "(deskripsi tampilan akta wasiat tertutup/rahasia)"} yang berisi akta wasiat tertutup/rahasia yang dibuat dan diserahkan untuk disimpan Notaris penyimpan oleh ${value.nama_pewasiat || "(nama Pewasiat)"};`,
    `PIHAK PERTAMA membuka penyimpanan akta wasiat tertutup/rahasia tersebut dan telah membacakan isi akta wasiat tertutup/rahasia tersebut di hadapan PIHAK KEDUA, para ahli waris Pewasiat, dan para saksi (akta wasiat tertutup/rahasia terlampir); dan`,
    `PIHAK PERTAMA telah mengembalikan akta wasiat tertutup/rahasia tersebut kepada PIHAK KEDUA untuk kemudian dilakukan pendaftaran wasiat tercatat ke Balai Harta Peninggalan Surabaya sebelum pelaksanaan isi wasiat tersebut.`,
  ];

  points.forEach((pt, index) => {
    doc.setFont("times", "normal");
    doc.text(`${index + 1}.`, 24, y);
    const wrapped = doc.splitTextToSize(pt, 159) as string[];
    doc.text(pt, 31, y, { maxWidth: 159, align: "justify", lineHeightFactor: 1.32 });
    y += wrapped.length * 4.65 + 2;
  });

  // Paragraf Penutup
  y += 1;
  const closingText =
    "        Berita acara ini dibuat dengan sesungguhnya dalam 2 (dua) rangkap yang sama dan ditandatangani oleh kedua pihak pada hari tanggal tersebut di atas untuk dapat dipergunakan sebagaimana mestinya.";
  const closingLines = doc.splitTextToSize(closingText, 170) as string[];
  doc.text(closingText, 20, y, { maxWidth: 170, align: "justify", lineHeightFactor: 1.32 });
  y += closingLines.length * 4.7 + 7;

  // Blok Tanda Tangan
  const leftColX = 20;
  const rightColX = 115;

  doc.setFont("times", "normal");
  doc.text(`Dibuat di ${value.tempat_dibuat || "…"}`, rightColX, y);
  y += 4.8;

  doc.setFont("times", "bold");
  doc.text("PIHAK KEDUA,", leftColX, y);
  doc.text("PIHAK PERTAMA,", rightColX, y);
  y += 17;

  const namaP2 = value.pihak_kedua_nama || "……………";
  const namaP1 = value.pihak_pertama_nama || "……………";
  doc.setFont("times", "bold");
  doc.text(namaP2, leftColX, y);
  doc.text(namaP1, rightColX, y);

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.line(leftColX, y + 1, leftColX + doc.getTextWidth(namaP2), y + 1);
  doc.line(rightColX, y + 1, rightColX + doc.getTextWidth(namaP1), y + 1);
  y += 10;

  // Saksi-saksi (2 saksi)
  doc.setFont("times", "bold");
  doc.text("Saksi-saksi", 20, y);
  y += 6.5;

  [value.saksi_1, value.saksi_2].forEach((saksi, idx) => {
    doc.setFont("times", "normal");
    doc.text(`${idx + 1}.`, 20, y);
    if (saksi) {
      doc.text(saksi, 26, y);
    }
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.25);
    doc.setLineDashPattern([0.8, 1], 0);
    doc.line(26, y + 1, 96, y + 1);
    doc.line(115, y + 1, 188, y + 1);
    doc.setLineDashPattern([], 0);
    y += 7;
  });
}

export async function downloadBaPdf(value: BaForm): Promise<string> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logoDataUrl = await loadImageDataUrl("/assets/aistudio/image_9c64760d.png");

  drawCopyPage(doc, value, 1, logoDataUrl);
  doc.addPage("a4", "portrait");
  drawCopyPage(doc, value, 2, logoDataUrl);

  const safeNum = (value.nomor_ba || "Berita-Acara").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "");
  const filename = `Berita-Acara-${safeNum}.pdf`;
  doc.save(filename);
  return filename;
}
