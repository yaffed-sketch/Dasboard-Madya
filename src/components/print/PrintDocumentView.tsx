import BaDocumentBody from "@/components/berita-acara/BaDocumentBody";
import type { BaForm } from "@/lib/types";

interface PrintDocumentViewProps {
  value: BaForm;
  copy: 1 | 2;
  hasNextPage?: boolean;
}

export default function PrintDocumentView({ value, copy, hasNextPage = false }: PrintDocumentViewProps) {
  const label = copy === 1 ? "Cetakan 1 — Pihak Pertama" : "Cetakan 2 — Pihak Kedua";

  return (
    <section
      className={`mx-auto mb-8 w-full max-w-[794px] rounded-lg border border-slate-200 bg-white px-8 py-10 shadow-sm sm:px-14 sm:py-12 print:mb-0 print:max-w-none print:rounded-none print:border-0 print:px-0 print:py-0 print:shadow-none ${
        hasNextPage ? "break-after-page" : ""
      }`}
    >
      <p className="mb-5 text-right font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 print:text-slate-500">
        {label}
      </p>
      <BaDocumentBody value={value} />
    </section>
  );
}
