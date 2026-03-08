import React, { useState } from "react";
import { useAppContext } from "../store/AppContext";
import { Device, DeviceStatus, Supplier } from "../types";
import { Plus, Search, Smartphone, Settings2, XCircle, History, User, Clock, ArrowRightLeft, Info, ChevronRight } from "lucide-react";
import SearchableSelect from "../components/SearchableSelect";
import { format } from "date-fns";

export default function KhoMay() {
  const { state, dispatch } = useAppContext();
  const [selectedDeviceForHistory, setSelectedDeviceForHistory] = useState<Device | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // States for Supplier Modal
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  const [visibleColumns, setVisibleColumns] = useState({
    imei: true,
    model: true,
    source: true,
    status: true,
    importDate: true,
    location: true,
    defect: true,
    appearance: true,
    currentError: true,
    importPrice: true,
    totalCost: true,
    finalPrice: true,
  });
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'KHO_TONG' | 'KY_THUAT' | 'QC' | 'CHO_TRA_NCC' | 'DA_TRA_NCC'>('KHO_TONG');

  const technicians = state.users.filter(u => u.role === 'KY_THUAT');

  const uniqueModels: string[] = Array.from(new Set(state.products.map(p => p.model))).filter((m): m is string => !!m).sort();

  const SHOP_LABELS: Record<string, string> = {
    KHO_TONG: 'Kho Tổng',
    XSTORE: 'Xstore',
    PH_DN: 'PH Đà Nẵng',
    PH_HUE: 'PH Huế',
    PH_QNG: 'PH Quảng Ngãi',
    DA_BAN: 'Đã Bán',
  };

  const getDeviceLocation = (device: Device) => {
    // Prioritize active task (Technician)
    const activeTask = state.tasks.find(t => t.deviceId === device.id && !['DONG_TASK', 'HUY_TASK'].includes(t.status));
    if (activeTask) {
      const assignee = state.users.find(u => u.id === activeTask.assigneeId);
      return assignee ? `KT: ${assignee.name}` : 'Kho Tổng';
    }
    
    // Then check physical location (Shop)
    if (device.location && device.location !== 'KHO_TONG') {
      return SHOP_LABELS[device.location] || device.location;
    }
    
    return 'Kho Tổng';
  };

  const getDeviceAssigneeId = (device: Device) => {
    const activeTask = state.tasks.find(t => t.deviceId === device.id && !['DONG_TASK', 'HUY_TASK'].includes(t.status));
    return activeTask?.assigneeId || 'KHO_TONG';
  };

  const getCurrentErrors = (deviceId: string) => {
    const activeTasks = state.tasks.filter(t => t.deviceId === deviceId && t.status !== 'HOAN_THANH_CHO_QC' && t.status !== 'DONG_TASK' && t.status !== 'HUY_TASK');
    if (activeTasks.length === 0) return '---';
    return activeTasks.map(t => t.type).join(', ');
  };

  const calculateTotalCost = (deviceId: string) => {
    const deviceTasks = state.tasks.filter(t => t.deviceId === deviceId);
    let totalCost = 0;
    deviceTasks.forEach(task => {
      if (task.usedParts) {
        task.usedParts.forEach(up => {
          const part = state.parts.find(p => p.id === up.partId);
          if (part) {
            totalCost += part.cost * up.quantity;
          }
        });
      }
    });
    return totalCost;
  };

  const handleReturnToNCC = (device: Device) => {
    dispatch({
      type: "UPDATE_DEVICE",
      payload: { ...device, status: "DA_TRA_NCC" }
    });
  };

  const filteredDevices = state.devices.filter(d => {
    const matchesSearch = d.imei.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         d.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // Exclusion: Sold or Returned devices are generally not in "Kho Máy" management
    // unless explicitly looking at "Đã trả NCC" history
    if (activeTab !== 'DA_TRA_NCC' && (d.status === 'DA_BAN' || d.status === 'DA_TRA_NCC')) return false;

    // Exclusion: Devices at shops with no active task are not under technical stock management
    const activeTask = state.tasks.find(t => t.deviceId === d.id && !['DONG_TASK', 'HUY_TASK'].includes(t.status));
    if (!activeTask && d.location && d.location !== 'KHO_TONG') return false;

    if (activeTab === 'KHO_TONG') {
      // Kho Kỹ thuật trưởng (Kho Tổng):
      // 1. Không có task đang xử lý (activeTask is null)
      // 2. Hoặc máy đã Hoàn tất (HOAN_TAT) - chuyển về Kỹ thuật trưởng
      // 3. Hoặc máy mới nhập (CHO_TEST, DA_TEST, SAN_SANG, CHO_BAN, CHO_PHAN_TASK)
      if (d.status === 'CHO_QC') return false; // QC is separate
      if (activeTask && d.status !== 'HOAN_TAT') return false; // If has active task and not finished, it's with tech
      
      return (
        d.status === 'SAN_SANG' || 
        d.status === 'CHO_TEST' || 
        d.status === 'DA_TEST' ||
        d.status === 'CHO_BAN' ||
        d.status === 'CHO_PHAN_TASK' ||
        d.status === 'CHO_QUYET_DINH' ||
        d.status === 'HOAN_TAT' ||
        d.status === 'MOI_NHAP'
      );
    }

    if (activeTab === 'KY_THUAT') {
      // Kho các thành viên kỹ thuật khác: Có task đang xử lý và chưa hoàn tất/QC
      if (!activeTask) return false;
      if (d.status === 'HOAN_TAT' || d.status === 'CHO_QC') return false;
      
      if (selectedTechId !== 'ALL' && activeTask.assigneeId !== selectedTechId) return false;
      return true;
    }

    if (activeTab === 'QC') {
      return d.status === 'CHO_QC';
    }

    if (activeTab === 'CHO_TRA_NCC') return d.status === 'CHO_TRA_NCC';
    if (activeTab === 'DA_TRA_NCC') return d.status === 'DA_TRA_NCC';
    
    return true;
  });

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name) return alert("Vui lòng nhập tên nhà cung cấp");

    const newSupplier: Supplier = {
      id: `sup-${Date.now()}`,
      name: supplierForm.name,
      phone: supplierForm.phone,
      address: supplierForm.address,
      notes: supplierForm.notes,
    };

    dispatch({ type: "ADD_SUPPLIER", payload: newSupplier });
    setShowSupplierModal(false);
    setSupplierForm({ name: "", phone: "", address: "", notes: "" });
    alert("Đã thêm nhà cung cấp mới!");
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <h1 className="text-2xl font-bold text-neon-cyan neon-text">Quản Lý Kho Máy Theo Vị Trí</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          </div>
        </div>

        <div className="bg-dark-card p-1 rounded-lg border border-dark-border overflow-hidden">
          <div className="tab-scroll p-1 flex gap-2">
            <button
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap ${activeTab === 'KHO_TONG' ? 'bg-neon-cyan text-dark-bg' : 'text-dark-muted hover:text-dark-text'}`}
              onClick={() => setActiveTab('KHO_TONG')}
            >
              Kho Kỹ Thuật Trưởng
            </button>
            <button
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap ${activeTab === 'KY_THUAT' ? 'bg-neon-cyan text-dark-bg' : 'text-dark-muted hover:text-dark-text'}`}
              onClick={() => setActiveTab('KY_THUAT')}
            >
              Kho Kỹ Thuật Viên
            </button>
            <button
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap ${activeTab === 'QC' ? 'bg-neon-cyan text-dark-bg' : 'text-dark-muted hover:text-dark-text'}`}
              onClick={() => setActiveTab('QC')}
            >
              Kho QC
            </button>
            <button
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap ${activeTab === 'CHO_TRA_NCC' ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30' : 'text-dark-muted hover:text-dark-text'}`}
              onClick={() => setActiveTab('CHO_TRA_NCC')}
            >
              Chờ Trả NCC
            </button>
            <button
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap ${activeTab === 'DA_TRA_NCC' ? 'bg-dark-bg text-dark-muted border border-dark-border' : 'text-dark-muted hover:text-dark-text'}`}
              onClick={() => setActiveTab('DA_TRA_NCC')}
            >
              Đã Trả NCC
            </button>
          </div>
        </div>

        {activeTab === 'KY_THUAT' && (
          <div className="flex items-center space-x-4 bg-dark-card p-4 rounded-xl border border-dark-border">
            <span className="text-sm font-medium text-dark-muted">Kỹ thuật viên:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTechId('ALL')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${selectedTechId === 'ALL' ? 'bg-neon-cyan text-dark-bg' : 'bg-dark-bg text-dark-muted border border-dark-border'}`}
              >
                Tất cả KTV
              </button>
              {technicians.map(tech => (
                <button
                  key={tech.id}
                  onClick={() => setSelectedTechId(tech.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${selectedTechId === tech.id ? 'bg-neon-cyan text-dark-bg' : 'bg-dark-bg text-dark-muted border border-dark-border'}`}
                >
                  {tech.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-dark-card p-4 rounded-xl border border-dark-border">
            <p className="text-[10px] font-bold text-dark-muted uppercase mb-1">Tổng số máy</p>
            <p className="text-lg font-bold text-dark-text">{filteredDevices.length}</p>
          </div>
          <div className="bg-dark-card p-4 rounded-xl border border-dark-border">
            <p className="text-[10px] font-bold text-dark-muted uppercase mb-1">Tổng vốn nhập</p>
            <p className="text-lg font-bold text-neon-cyan">
              {filteredDevices.reduce((sum, d) => sum + d.importPrice, 0).toLocaleString('vi-VN')} đ
            </p>
          </div>
          <div className="bg-dark-card p-4 rounded-xl border border-dark-border">
            <p className="text-[10px] font-bold text-dark-muted uppercase mb-1">CP Sửa chữa</p>
            <p className="text-lg font-bold text-neon-pink">
              {filteredDevices.reduce((sum, d) => sum + calculateTotalCost(d.id), 0).toLocaleString('vi-VN')} đ
            </p>
          </div>
          <div className="bg-dark-card p-4 rounded-xl border border-dark-border">
            <p className="text-[10px] font-bold text-dark-muted uppercase mb-1">Giá trị kho</p>
            <p className="text-lg font-bold text-neon-green">
              {filteredDevices.reduce((sum, d) => sum + d.importPrice + calculateTotalCost(d.id), 0).toLocaleString('vi-VN')} đ
            </p>
          </div>
        </div>

      <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border">
        <div className="p-4 border-b border-dark-border bg-dark-bg/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-t-xl">
          <h3 className="text-lg font-medium text-dark-text">Danh sách máy</h3>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted" />
              <input
                type="text"
                placeholder="Tìm IMEI, Model..."
                className="w-full pl-9 pr-4 py-2 rounded-md text-sm dark-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className="p-2 border border-dark-border rounded-md hover:bg-dark-border text-dark-muted hover:text-dark-text"
                title="Tùy chỉnh cột"
              >
                <Settings2 className="w-5 h-5" />
              </button>
              {showColumnSettings && (
                <div className="absolute right-0 mt-2 w-56 bg-dark-card rounded-md shadow-lg border border-dark-border z-50 p-2">
                  <h4 className="text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2 px-2">Hiển thị cột</h4>
                  <div className="space-y-1">
                    {Object.entries({
                      imei: 'IMEI',
                      model: 'Model',
                      source: 'Nguồn',
                      status: 'Trạng Thái',
                      importDate: 'Ngày Nhập',
                      location: 'Vị trí kho',
                      defect: 'Tình trạng lỗi',
                      appearance: 'Ngoại hình',
                      currentError: 'Lỗi đang xử lý',
                      importPrice: 'Giá Nhập',
                      totalCost: 'Tổng CP Xử Lý',
                      finalPrice: 'Giá Cuối'
                    }).map(([key, label]) => (
                      <label key={key} className="flex items-center px-2 py-1 hover:bg-dark-border rounded cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-dark-border bg-dark-bg text-neon-cyan focus:ring-neon-cyan mr-2"
                          checked={visibleColumns[key as keyof typeof visibleColumns]}
                          onChange={() => setVisibleColumns(prev => ({ ...prev, [key]: !prev[key as keyof typeof visibleColumns] }))}
                        />
                        <span className="text-sm text-dark-text">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="dark-table-container rounded-b-xl">
          <table className="dark-table">
            <thead>
              <tr>
                {visibleColumns.imei && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">IMEI</th>}
                {visibleColumns.model && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Model</th>}
                {visibleColumns.source && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Nguồn</th>}
                {visibleColumns.status && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Trạng Thái</th>}
                {visibleColumns.importDate && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ngày Nhập</th>}
                {visibleColumns.location && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Vị trí kho</th>}
                {visibleColumns.defect && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tình trạng lỗi</th>}
                {visibleColumns.appearance && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ngoại hình</th>}
                {visibleColumns.currentError && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Lỗi đang xử lý</th>}
                {visibleColumns.importPrice && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Giá Nhập</th>}
                {visibleColumns.totalCost && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tổng CP Xử Lý</th>}
                {visibleColumns.finalPrice && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Giá Cuối</th>}
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device) => {
                const totalCost = calculateTotalCost(device.id);
                const finalPrice = device.importPrice + totalCost;
                return (
                  <tr key={device.id}>
                    {visibleColumns.imei && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">
                        <button 
                          onClick={() => setSelectedDeviceForHistory(device)}
                          className="flex items-center hover:text-neon-cyan transition-colors group"
                        >
                          <Smartphone className="w-4 h-4 mr-2 text-neon-cyan group-hover:scale-110 transition-transform" />
                          <span className="border-b border-transparent group-hover:border-neon-cyan">{device.imei}</span>
                        </button>
                      </td>
                    )}
                    {visibleColumns.model && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                        {device.model} ({device.capacity})
                      </td>
                    )}
                    {visibleColumns.source && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            device.source === "Khách thu cũ (Trade-in)"
                              ? "bg-neon-pink/10 text-neon-pink border border-neon-pink/30"
                              : "bg-dark-border text-dark-text"
                          }`}
                        >
                          {device.source}
                        </span>
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            device.status === "CHO_TEST"
                              ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
                              : device.status === "CHO_TRA_NCC"
                                ? "bg-neon-pink/10 text-neon-pink border border-neon-pink/30"
                                : device.status === "DA_TRA_NCC"
                                  ? "bg-dark-border text-dark-muted border border-dark-border"
                                  : "bg-neon-green/10 text-neon-green border border-neon-green/30"
                          }`}
                        >
                          {device.status.replace(/_/g, " ")}
                        </span>
                        {device.status === 'CHO_TRA_NCC' && (state.currentUser?.role === 'ADMIN' || state.currentUser?.role === 'TRUONG_KT') && (
                          <button
                            onClick={() => handleReturnToNCC(device)}
                            className="ml-2 text-xs text-neon-cyan hover:underline"
                          >
                            Xác nhận trả NCC
                          </button>
                        )}
                      </td>
                    )}
                    {visibleColumns.importDate && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                        {device.importDate}
                      </td>
                    )}
                    {visibleColumns.location && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text font-medium">
                        {getDeviceLocation(device)}
                      </td>
                    )}
                    {visibleColumns.defect && (
                      <td className="px-6 py-4 text-sm text-dark-muted max-w-xs truncate" title={device.notes}>
                        {device.notes || '---'}
                      </td>
                    )}
                    {visibleColumns.appearance && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          device.appearance === 'LN' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' :
                          device.appearance === '99%' ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' :
                          'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                        }`}>
                          {device.appearance || '---'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.currentError && (
                      <td className="px-6 py-4 text-sm text-dark-muted max-w-xs truncate" title={getCurrentErrors(device.id)}>
                        {getCurrentErrors(device.id)}
                      </td>
                    )}
                    {visibleColumns.importPrice && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                        {device.importPrice.toLocaleString('vi-VN')} đ
                      </td>
                    )}
                    {visibleColumns.totalCost && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neon-pink font-medium">
                        {totalCost > 0 ? `+${totalCost.toLocaleString('vi-VN')} đ` : '---'}
                      </td>
                    )}
                    {visibleColumns.finalPrice && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neon-cyan font-bold">
                        {finalPrice.toLocaleString('vi-VN')} đ
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredDevices.length === 0 && (
                <tr>
                  <td
                    colSpan={Object.values(visibleColumns).filter(Boolean).length}
                    className="px-6 py-8 text-center text-sm text-dark-muted"
                  >
                    Không tìm thấy máy nào trong mục này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm Nhà Cung Cấp */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-dark-card rounded-xl shadow-xl border border-neon-cyan/50 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-dark-border bg-neon-cyan/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-neon-cyan">Thêm Nhà Cung Cấp Mới</h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-dark-muted hover:text-neon-pink">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">Tên NCC / Nguồn *</label>
                <input 
                  type="text" required
                  className="w-full rounded-md p-2 text-sm dark-input"
                  placeholder="VD: Khách lẻ, Cửa hàng A..."
                  value={supplierForm.name}
                  onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">Số Điện Thoại</label>
                <input 
                  type="text"
                  className="w-full rounded-md p-2 text-sm dark-input"
                  value={supplierForm.phone}
                  onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">Địa Chỉ</label>
                <input 
                  type="text"
                  className="w-full rounded-md p-2 text-sm dark-input"
                  value={supplierForm.address}
                  onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-1">Ghi Chú</label>
                <textarea 
                  rows={2}
                  className="w-full rounded-md p-2 text-sm dark-input"
                  value={supplierForm.notes}
                  onChange={e => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-dark-border">
                <button type="button" onClick={() => setShowSupplierModal(false)} className="px-4 py-2 border border-dark-border rounded-md text-sm font-medium text-dark-muted hover:bg-dark-border/50">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 rounded-md shadow-sm text-sm font-medium neon-button flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm NCC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Lịch Sử Máy */}
      {selectedDeviceForHistory && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
          <div className="bg-dark-card rounded-2xl shadow-2xl border border-dark-border w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-dark-border bg-dark-bg/50 flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-neon-cyan/10 flex items-center justify-center mr-4 border border-neon-cyan/20">
                  <History className="w-6 h-6 text-neon-cyan" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-dark-text">Truy Xuất Lịch Sử Thiết Bị</h3>
                  <p className="text-sm text-dark-muted font-mono">IMEI: {selectedDeviceForHistory.imei}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDeviceForHistory(null)}
                className="p-2 text-dark-muted hover:text-neon-pink transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-dark-bg p-4 rounded-xl border border-dark-border">
                  <p className="text-xs font-bold text-dark-muted uppercase mb-3 flex items-center">
                    <Smartphone className="w-3 h-3 mr-1" /> Thông tin máy
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-dark-muted">Model:</span> <span className="text-dark-text font-medium">{selectedDeviceForHistory.model}</span></div>
                    <div className="flex justify-between"><span className="text-dark-muted">Màu sắc:</span> <span className="text-dark-text">{selectedDeviceForHistory.color}</span></div>
                    <div className="flex justify-between"><span className="text-dark-muted">Dung lượng:</span> <span className="text-dark-text">{selectedDeviceForHistory.capacity}</span></div>
                    <div className="flex justify-between"><span className="text-dark-muted">Ngoại hình:</span> <span className="text-neon-cyan font-bold">{selectedDeviceForHistory.appearance || '---'}</span></div>
                  </div>
                </div>

                <div className="bg-dark-bg p-4 rounded-xl border border-dark-border">
                  <p className="text-xs font-bold text-dark-muted uppercase mb-3 flex items-center">
                    <ArrowRightLeft className="w-3 h-3 mr-1" /> Tiếp nhận
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-dark-muted">Ngày nhận:</span> <span className="text-dark-text">{selectedDeviceForHistory.receptionDate || selectedDeviceForHistory.importDate}</span></div>
                    <div className="flex justify-between"><span className="text-dark-muted">Loại:</span> <span className="text-neon-green font-medium">{selectedDeviceForHistory.receptionType || 'NHẬP KHO'}</span></div>
                    <div className="flex justify-between"><span className="text-dark-muted">Nguồn:</span> <span className="text-dark-text">{selectedDeviceForHistory.source}</span></div>
                    <div className="flex justify-between"><span className="text-dark-muted">Trạng thái:</span> <span className="text-yellow-500 font-bold">{selectedDeviceForHistory.status.replace(/_/g, ' ')}</span></div>
                  </div>
                </div>

                <div className="bg-dark-bg p-4 rounded-xl border border-dark-border">
                  <p className="text-xs font-bold text-dark-muted uppercase mb-3 flex items-center">
                    <User className="w-3 h-3 mr-1" /> Khách hàng
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-dark-muted">Tên:</span> <span className="text-dark-text">{selectedDeviceForHistory.customerInfo || '---'}</span></div>
                    <div className="flex justify-between"><span className="text-dark-muted">SĐT:</span> <span className="text-dark-text">{selectedDeviceForHistory.customerPhone || '---'}</span></div>
                    <div className="mt-2 p-2 bg-dark-card rounded text-[10px] text-dark-muted italic border border-dark-border">
                      Ghi chú ban đầu: {selectedDeviceForHistory.notes || "Không có"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dòng thời gian luân chuyển & sửa chữa */}
              <div>
                <h4 className="text-lg font-bold text-dark-text mb-6 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-neon-pink" />
                  Lịch Sử Luân Chuyển & Sửa Chữa
                </h4>
                <div className="relative border-l-2 border-dark-border ml-4 pl-8 space-y-8">
                  {/* Bước 1: Tiếp nhận */}
                  <div className="relative">
                    <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-neon-green border-4 border-dark-card shadow-[0_0_10px_rgba(0,255,0,0.5)]"></div>
                    <div className="bg-dark-bg p-4 rounded-xl border border-dark-border">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-neon-green uppercase">Tiếp nhận thiết bị</span>
                        <span className="text-xs text-dark-muted">{selectedDeviceForHistory.receptionDate || selectedDeviceForHistory.importDate}</span>
                      </div>
                      <p className="text-sm text-dark-text">Máy được tiếp nhận vào hệ thống bởi <span className="text-neon-cyan">Admin</span>.</p>
                    </div>
                  </div>

                  {/* Các Task sửa chữa */}
                  {state.tasks.filter(t => t.deviceId === selectedDeviceForHistory.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((task, idx) => {
                    const assignee = state.users.find(u => u.id === task.assigneeId);
                    const qcReport = state.qcReports.find(r => r.taskId === task.id);
                    return (
                      <div key={task.id} className="relative">
                        <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-neon-cyan border-4 border-dark-card shadow-[0_0_10px_rgba(0,255,255,0.5)]"></div>
                        <div className="bg-dark-bg p-4 rounded-xl border border-dark-border">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <span className="text-xs font-bold text-neon-cyan uppercase mr-2">{task.type}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                task.status === 'DONG_TASK' ? 'bg-neon-green/20 text-neon-green' : 'bg-yellow-500/20 text-yellow-500'
                              }`}>
                                {task.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <span className="text-xs text-dark-muted">{task.createdAt}</span>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-dark-text">
                              Kỹ thuật viên: <span className="text-neon-cyan font-medium">{assignee?.name || 'Chưa phân'}</span>
                            </p>
                            {task.description && (
                              <p className="text-xs text-dark-muted bg-dark-card p-2 rounded border border-dark-border">
                                <Info className="w-3 h-3 inline mr-1" /> {task.description}
                              </p>
                            )}
                            {task.usedParts && task.usedParts.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {task.usedParts.map(up => {
                                  const part = state.parts.find(p => p.id === up.partId);
                                  return (
                                    <span key={up.partId} className="px-2 py-1 bg-dark-card border border-dark-border rounded text-[10px] text-dark-text">
                                      Thay: {part?.name} x{up.quantity}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                            {qcReport && (
                              <div className={`mt-3 p-3 rounded-lg border ${qcReport.status === 'PASS' ? 'bg-neon-green/5 border-neon-green/20' : 'bg-neon-pink/5 border-neon-pink/20'}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-[10px] font-bold uppercase ${qcReport.status === 'PASS' ? 'text-neon-green' : 'text-neon-pink'}`}>
                                    Kết quả QC: {qcReport.status}
                                  </span>
                                  <span className="text-[10px] text-dark-muted">{qcReport.createdAt}</span>
                                </div>
                                <p className="text-xs text-dark-muted italic">"{qcReport.notes}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Bước cuối: Hiện tại */}
                  <div className="relative">
                    <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-dark-border border-4 border-dark-card"></div>
                    <div className="bg-dark-card/50 p-4 rounded-xl border border-dark-border border-dashed">
                      <p className="text-xs font-bold text-dark-muted uppercase mb-1">Trạng thái hiện tại</p>
                      <div className="flex items-center text-sm text-dark-text">
                        <ChevronRight className="w-4 h-4 text-neon-cyan mr-1" />
                        Đang ở: <span className="text-neon-cyan font-bold ml-1">{getDeviceLocation(selectedDeviceForHistory)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-dark-border bg-dark-bg/50 flex justify-end">
              <button 
                onClick={() => setSelectedDeviceForHistory(null)}
                className="px-6 py-2 bg-dark-card border border-dark-border rounded-lg text-sm font-medium text-dark-text hover:bg-dark-border transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
