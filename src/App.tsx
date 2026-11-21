import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { ToastProvider } from "@/components/ui/ToastProvider";
import BuatBa from "@/pages/BuatBa";
import Cetak from "@/pages/Cetak";
import Dashboard from "@/pages/Dashboard";
import History from "@/pages/History";
import UploadDokumen from "@/pages/UploadDokumen";

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/buat-ba/:id" element={<BuatBa />} />
            <Route path="/upload/:id" element={<UploadDokumen />} />
          </Route>
          <Route path="/print/:id" element={<Cetak />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
