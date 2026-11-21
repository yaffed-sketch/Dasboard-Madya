import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FolderUp } from "lucide-react";
import BaDocumentBody from "@/components/berita-acara/BaDocumentBody";
import BeritaAcaraForm from "@/components/berita-acara/BeritaAcaraForm";
import { useToast } from "@/components/ui/ToastProvider";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { downloadBaPdf } from "@/lib/baPdf";
import { hariDariTanggal } from "@/lib/format";
import type {
  ApprovalCodeRequestResponse,
  ApprovalCodeVerifyResponse,
  BaForm,
  Dokumen,
  Layanan,
} from "@/lib/types";

const DEFAULT_KEPALA_BHP = {
  nama: "Hendro Setyawan, S.H., M.H.",
  nip: "197503182001121001",
  jabatan: "Kepala Balai Harta Peninggalan Surabaya",
};

function pihakPertamaUntuk(l: Layanan, adaSuratKuasa: boolean) {
  if (adaSuratKuasa) {
    return {
      pihak_pertama_nama: l.pejabat_nama ?? l.notaris_nama ?? "Ayu Rachmawati, S.H., M.Kn.",
      pihak_pertama_nip: l.pejabat_nip ?? "198405122010122001",
      pihak_pertama_jabatan: l.pejabat_jabatan ?? "Kurator Keperdataan Ahli Madya",
    };
  }
  return {
    pihak_pertama_nama: l.kepala_bhp_nama ?? DEFAULT_KEPALA_BHP.nama,
    pihak_pertama_nip: l.kepala_bhp_nip ?? DEFAULT_KEPALA_BHP.nip,
    pihak_pertama_jabatan: l.kepala_bhp_jabatan ?? DEFAULT_KEPALA_BHP.jabatan,
  };
}

function draftDari(l: Layanan, hasUploadedSuratKuasa: boolean): BaForm {
  const ba = l.ba;
  const tgl = ba?.tanggal ?? l.jadwal_pembukaan;
  const adaSuratKuasa = ba?.ada_surat_kuasa ?? l.ada_surat_kuasa ?? hasUploadedSuratKuasa;
  const defaultPihak1 = pihakPertamaUntuk(l, adaSuratKuasa);

  const noUrutSuffix = l.no_layanan.includes("-")
    ? l.no_layanan.slice(l.no_layanan.indexOf("-") + 1)
    : l.no_layanan;

  return {
    nomor_ba: l.nomor_ba ?? ba?.nomor_ba ?? `W15.BHP.02-${noUrutSuffix.replace("/", "/BA-WT/")}`,
    ada_surat_kuasa: adaSuratKuasa,
    tanggal_surat_kuasa: ba?.tanggal_surat_kuasa ?? l.tanggal_surat_kuasa ?? l.jadwal_pembukaan,
    hari: ba?.hari ?? hariDariTanggal(tgl),
    tanggal: tgl,
    tempat_dibuat: ba?.tempat_dibuat ?? "Sidoarjo",
    pihak_pertama_nama: ba?.pihak_pertama_nama ?? defaultPihak1.pihak_pertama_nama,
    pihak_pertama_nip: ba?.pihak_pertama_nip ?? defaultPihak1.pihak_pertama_nip,
    pihak_pertama_jabatan: ba?.pihak_pertama_jabatan ?? defaultPihak1.pihak_pertama_jabatan,
    pihak_kedua_nama: ba?.pihak_kedua_nama ?? l.pemohon,
    pihak_kedua_jabatan: ba?.pihak_kedua_jabatan ?? l.pemohon_jabatan ?? "Notaris / Pemohon",
    pihak_kedua_alamat: ba?.pihak_kedua_alamat ?? l.pemohon_alamat,
    deskripsi_wasiat:
      ba?.deskripsi_wasiat ??
      l.deskripsi_wasiat ??
      "1 (satu) buah amplop coklat ukuran A4 dalam keadaan tertutup dan tersegel",
    nama_pewasiat: ba?.nama_pewasiat ?? l.nama_pewasiat ?? l.pihak_kedua_nama ?? "",
    saksi_1: ba?.saksi_1 ?? "",
    saksi_2: ba?.saksi_2 ?? "",
  };
}

export default function BuatBa() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [layanan, setLayanan] = useState<Layanan | null>(null);
  const [form, setForm] = useState<BaForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [savingMode, setSavingMode] = useState<"print" | "download" | null>(null);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");

  // Approval code state
  const [approvalCode, setApprovalCode] = useState("");
  const [requestingCode, setRequestingCode] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [codeDispatchInfo, setCodeDispatchInfo] = useState<ApprovalCodeRequestResponse | null>(null);
  const [codeVerification, setCodeVerification] = useState<{
    status: "idle" | "checking" | "valid" | "invalid";
    message: string;
  }>({ status: "idle", message: "" });

  const loadLayanan = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const [data, docs] = await Promise.all([
        apiGet<Layanan>(`/layanan/${id}`),
        apiGet<Dokumen[]>(`/layanan/${id}/dokumen`).catch(() => [] as Dokumen[]),
      ]);
      const hasUploadedSuratKuasa = docs.some((d) => d.jenis === "surat_kuasa");
      setLayanan(data);
      setForm(draftDari(data, hasUploadedSuratKuasa));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadLayanan();
  }, [loadLayanan]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((s) => (s > 1 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (!id) return;
    if (approvalCode.length === 0) {
      setCodeVerification({ status: "idle", message: "" });
      return;
    }
    if (approvalCode.length < 6) {
      setCodeVerification({
        status: "invalid",
        message: "Masukkan lengkap 6 digit kode persetujuan.",
      });
      return;
    }

    let cancelled = false;
    setCodeVerification({ status: "checking", message: "" });

    apiPost<ApprovalCodeVerifyResponse>(`/layanan/${id}/verifikasi-kode`, { code: approvalCode })
      .then((res) => {
        if (cancelled) return;
        setCodeVerification({
          status: res.valid ? "valid" : "invalid",
          message: res.message,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setCodeVerification({
          status: "invalid",
          message: "Gagal memeriksa kode persetujuan.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [id, approvalCode]);

  const handlePatch = (patch: Partial<BaForm>) => {
    setForm((prev) => {
      if (!prev) return prev;
      const { nomor_ba: _lockedNomorBa, ...safePatch } = patch;
      const next = { ...prev, ...safePatch };
      if (safePatch.tanggal !== undefined) {
        next.hari = hariDariTanggal(safePatch.tanggal) || next.hari;
      }
      return next;
    });
  };

  const handleToggleSuratKuasa = (adaSuratKuasa: boolean) => {
    if (!layanan) return;
    const pihak1 = pihakPertamaUntuk(layanan, adaSuratKuasa);
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ada_surat_kuasa: adaSuratKuasa,
        ...pihak1,
      };
    });
  };

  const handleRequestApprovalCode = async () => {
    if (!id) return;
    setRequestingCode(true);
    try {
      const res = await apiPost<ApprovalCodeRequestResponse>(`/layanan/${id}/kode-persetujuan`);
      setCodeDispatchInfo(res);
      setApprovalCode("");
      setCodeVerification({ status: "idle", message: "" });
      setCooldownSeconds(30);
      toast.success(`Kode persetujuan dikirim ke email Fungsional Madya (${res.masked_email})`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memesan kode persetujuan");
    } finally {
      setRequestingCode(false);
    }
  };

  const handleSaveAndPrint = async () => {
    if (!id || !form || codeVerification.status !== "valid") return;
    setSavingMode("print");
    try {
      const updated = await apiPut<Layanan>(`/layanan/${id}/ba`, {
        ...form,
        approval_code: approvalCode,
      });
      setLayanan(updated);
      toast.success("Berita Acara terotorisasi & tersimpan — membuka halaman cetak 2 salinan");
      navigate(`/print/${id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan Berita Acara";
      setCodeVerification({ status: "invalid", message: msg });
      toast.error(msg);
    } finally {
      setSavingMode(null);
    }
  };

  const handleSaveAndDownload = async () => {
    if (!id || !form || codeVerification.status !== "valid") return;
    setSavingMode("download");
    try {
      const updated = await apiPut<Layanan>(`/layanan/${id}/ba`, {
        ...form,
        approval_code: approvalCode,
      });
      setLayanan(updated);
      setApprovalCode("");
      setCodeVerification({ status: "idle", message: "" });
      const filename = await downloadBaPdf(updated.ba ?? form);
      toast.success(`Berita Acara tersimpan & "${filename}" diunduh (siap dibagikan via WA/Email)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan & mengunduh Berita Acara";
      setCodeVerification({ status: "invalid", message: msg });
      toast.error(msg);
    } finally {
      setSavingMode(null);
    }
  };

  if (loading) {
    return <div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white" />;
  }

  if (error || !layanan || !form) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-8 text-sm text-slate-600">
        Data layanan tidak ditemukan atau gagal dimuat.{" "}
        <Link to="/" className="font-semibold text-blue-600 hover:underline">
          Kembali ke daftar layanan
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to="/"
            aria-label="Kembali ke dashboard"
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
              Buat & Reviu Berita Acara
            </h1>
            <p className="mt-0.5 text-sm text-slate-600">
              <span className="font-mono text-xs font-semibold text-slate-800">{layanan.no_layanan}</span>
              <span aria-hidden="true"> · </span>
              <span>{layanan.jenis_layanan}</span>
              <span aria-hidden="true"> · </span>
              <span>{layanan.pemohon}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/upload/${layanan.id}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <FolderUp className="size-3.5" />
            <span>Upload Berkas</span>
          </Link>
        </div>
      </header>

      {/* Mobile / Tablet Switcher */}
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 xl:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("form")}
          className={`h-9 flex-1 rounded-md text-xs font-medium transition-colors ${
            mobileTab === "form" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
          }`}
        >
          Formulir Berita Acara
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`h-9 flex-1 rounded-md text-xs font-medium transition-colors ${
            mobileTab === "preview" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
          }`}
        >
          Pratinjau Dokumen
        </button>
      </div>

      {/* Split Workspace */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[460px_minmax(0,1fr)]">
        <div
          className={`rounded-xl border border-slate-200 bg-white p-5 sm:p-6 ${
            mobileTab === "preview" ? "hidden xl:block" : "block"
          }`}
        >
          <BeritaAcaraForm
            noLayanan={layanan.no_layanan}
            value={form}
            onChange={handlePatch}
            onToggleSuratKuasa={handleToggleSuratKuasa}
            onSaveAndPrint={handleSaveAndPrint}
            onSaveAndDownload={handleSaveAndDownload}
            savingMode={savingMode}
            approvalCode={approvalCode}
            onApprovalCodeChange={setApprovalCode}
            onRequestApprovalCode={handleRequestApprovalCode}
            requestingCode={requestingCode}
            cooldownSeconds={cooldownSeconds}
            codeDispatchInfo={codeDispatchInfo}
            codeVerification={codeVerification}
          />
        </div>

        <div
          className={`xl:sticky xl:top-20 ${
            mobileTab === "form" ? "hidden xl:block" : "block"
          }`}
        >
          <div className="mb-2.5 flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-600">Pratinjau Langsung Dokumen Resmi</span>
            <span className="text-xs text-slate-400">Format A4 · 2 Rangkap saat dicetak</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-100/70 p-4 sm:p-6">
            <div className="mx-auto max-w-[740px] rounded-lg border border-slate-200 bg-white px-8 py-10 shadow-sm sm:px-12 sm:py-12">
              <BaDocumentBody value={form} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
