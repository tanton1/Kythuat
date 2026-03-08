/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider } from "./store/AppContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import KhoMay from "./pages/KhoMay";
import TestDauVao from "./pages/TestDauVao";
import DieuPhoi from "./pages/DieuPhoi";
import KyThuat from "./pages/KyThuat";
import KhoLinhKien from "./pages/KhoLinhKien";
import QC from "./pages/QC";
import NhanVien from "./pages/NhanVien";
import PhanPhoi from "./pages/PhanPhoi";
import HangHoa from "./pages/HangHoa";
import BaoCaoThuNhap from "./pages/BaoCaoThuNhap";
import TiepNhan from "./pages/TiepNhan";
import QuyetDinh from "./pages/QuyetDinh";
import Login from "./pages/Login";
import Guide from "./pages/Guide";
import { useAppContext } from "./store/AppContext";

function AppRoutes() {
  const { state } = useAppContext();

  if (!state.currentUser) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="tiep-nhan" element={<TiepNhan />} />
        <Route path="kho-may" element={<KhoMay />} />
        <Route path="test-dau-vao" element={<TestDauVao />} />
        <Route path="quyet-dinh" element={<QuyetDinh />} />
        <Route path="dieu-phoi" element={<DieuPhoi />} />
        <Route path="ky-thuat" element={<KyThuat />} />
        <Route path="kho-linh-kien" element={<KhoLinhKien />} />
        <Route path="qc" element={<QC />} />
        <Route path="phan-phoi" element={<PhanPhoi />} />
        <Route path="hang-hoa" element={<HangHoa />} />
        <Route path="bao-cao-thu-nhap" element={<BaoCaoThuNhap />} />
        <Route path="nhan-vien" element={<NhanVien />} />
        <Route path="huong-dan" element={<Guide />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}
