import React, { useState } from "react";
import { useAppContext } from "../store/AppContext";
import { Device, DeviceStatus } from "../types";
import SearchableSelect from "../components/SearchableSelect";
import { 
  Store, 
  ShieldAlert, 
  UserPlus, 
  Smartphone, 
  Save, 
  Search, 
  History,
  AlertCircle,
  ArrowRightLeft
} from "lucide-react";
import { format } from "date-fns";

export default function TiepNhan() {
  const { state, dispatch } = useAppContext();
  const [activeTab, setActiveTab] = useState<'SHOP' | 'WARRANTY' | 'SERVICE' | 'TRADE_IN'>('SHOP');
  const [searchImei, setSearchImei] = useState("");
  const [foundDevice, setFoundDevice] = useState<Device | null>(null);

  const uniqueModels: string[] = Array.from(new Set(state.products.map(p => p.model))).filter((m): m is string => !!m).sort();

  const [formData, setFormData] = useState<Partial<Device>>({
    imei: "",
    model: "",
    color: "",
    capacity: "",
    source: "",
    notes: "",
    customerInfo: "",
    customerPhone: "",
  });

  const handleSearch = () => {
    const device = state.devices.find(d => d.imei === searchImei);
    if (device) {
      setFoundDevice(device);
      setFormData({
        ...device,
        notes: "", // Clear notes for new reception
      });
    } else {
      setFoundDevice(null);
      alert("Không tìm thấy máy trong hệ thống. Vui lòng nhập mới.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const receptionType = activeTab === 'SHOP' ? 'SHOP_TRANSFER' : 
                         activeTab === 'WARRANTY' ? 'WARRANTY' : 
                         activeTab === 'TRADE_IN' ? 'TRADE_IN' : 'SERVICE';
    
    const status: DeviceStatus = activeTab === 'SERVICE' ? 'CHO_PHAN_TASK' : 
                               activeTab === 'TRADE_IN' ? 'TRADE_IN' : 'CHO_TEST';

    const newDevice: Device = {
      id: foundDevice?.id || `dev-${Date.now()}`,
      imei: formData.imei || "",
      model: formData.model || "",
      color: formData.color || "",
      capacity: formData.capacity || "",
      source: activeTab === 'SHOP' ? formData.source || "" : 
              activeTab === 'TRADE_IN' ? "Khách thu cũ (Trade-in)" : "Khách Lẻ",
      importPrice: activeTab === 'TRADE_IN' ? Number(formData.importPrice) || 0 : foundDevice?.importPrice || 0,
      importDate: foundDevice?.importDate || format(new Date(), "yyyy-MM-dd HH:mm"),
      receiverId: state.currentUser!.id,
      status,
      notes: formData.notes || "",
      images: foundDevice?.images || [],
      receptionType,
      customerInfo: formData.customerInfo,
      customerPhone: formData.customerPhone,
      receptionDate: format(new Date(), "yyyy-MM-dd HH:mm"),
    };

    if (foundDevice) {
      dispatch({ type: "UPDATE_DEVICE", payload: newDevice });
    } else {
      dispatch({ type: "ADD_DEVICE", payload: newDevice });
    }

    // Reset form
    setFormData({ imei: "", model: "", color: "", capacity: "", source: "", notes: "", customerInfo: "", customerPhone: "" });
    setFoundDevice(null);
    setSearchImei("");
    alert("Tiếp nhận thành công!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h1 className="text-2xl font-bold text-neon-cyan neon-text">Tiếp Nhận Máy</h1>
        <div className="bg-dark-card p-1 rounded-lg border border-dark-border w-full lg:w-auto overflow-hidden">
          <div className="tab-scroll p-1">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center whitespace-nowrap ${activeTab === 'SHOP' ? 'bg-dark-bg text-neon-cyan shadow-sm border border-neon-cyan/30' : 'text-dark-muted hover:text-dark-text'}`}
              onClick={() => setActiveTab('SHOP')}
            >
              <Store className="w-4 h-4 mr-2" />
              Nhận từ Shop
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center whitespace-nowrap ${activeTab === 'TRADE_IN' ? 'bg-dark-bg text-neon-cyan shadow-sm border border-neon-cyan/30' : 'text-dark-muted hover:text-dark-text'}`}
              onClick={() => setActiveTab('TRADE_IN')}
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Thu Cũ
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center whitespace-nowrap ${activeTab === 'WARRANTY' ? 'bg-dark-bg text-neon-pink shadow-sm border border-neon-pink/30' : 'text-dark-muted hover:text-dark-text'}`}
              onClick={() => setActiveTab('WARRANTY')}
            >
              <ShieldAlert className="w-4 h-4 mr-2" />
              Bảo Hành
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center whitespace-nowrap ${activeTab === 'SERVICE' ? 'bg-dark-bg text-neon-green shadow-sm border border-neon-green/30' : 'text-dark-muted hover:text-dark-text'}`}
              onClick={() => setActiveTab('SERVICE')}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Sửa Lẻ
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Tìm kiếm & Thông tin máy */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-dark-card p-6 rounded-xl border border-dark-border shadow-sm">
            <h3 className="text-lg font-semibold text-dark-text mb-4 flex items-center">
              <Smartphone className="w-5 h-5 mr-2 text-neon-cyan" />
              Thông Tin Thiết Bị
            </h3>
            
            {(activeTab === 'WARRANTY' || activeTab === 'SERVICE' || activeTab === 'TRADE_IN') && (
              <div className="mb-6 p-4 bg-dark-bg rounded-lg border border-dark-border">
                <label className="block text-sm font-medium text-dark-muted mb-2">Tra cứu IMEI (Nếu đã có trong hệ thống)</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    className="flex-1 dark-input p-2 rounded-md"
                    placeholder="Nhập IMEI để kiểm tra lịch sử..."
                    value={searchImei}
                    onChange={(e) => setSearchImei(e.target.value)}
                  />
                  <button 
                    onClick={handleSearch}
                    className="px-4 py-2 bg-dark-border text-dark-text rounded-md hover:bg-dark-border/80 flex items-center"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Kiểm tra
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-dark-muted">IMEI/Serial *</label>
                  <input
                    type="text" required
                    className="mt-1 block w-full dark-input p-2 rounded-md text-lg font-mono tracking-wider"
                    placeholder="Nhập IMEI hoặc Serial máy..."
                    value={formData.imei}
                    onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                  />
                </div>
                <div>
                  <SearchableSelect
                    label="Model"
                    required
                    options={uniqueModels}
                    value={formData.model || ""}
                    onChange={(val) => setFormData({ ...formData, model: val })}
                    placeholder="VD: iPhone 13 Pro Max"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-dark-muted">Màu sắc</label>
                    <input
                      type="text"
                      className="mt-1 block w-full dark-input p-2 rounded-md"
                      placeholder="Màu"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-muted">Dung lượng</label>
                    <input
                      type="text"
                      className="mt-1 block w-full dark-input p-2 rounded-md"
                      placeholder="GB"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    />
                  </div>
                </div>
                
                {activeTab === 'TRADE_IN' && (
                  <div>
                    <label className="block text-sm font-medium text-dark-muted">Giá Thu (VNĐ) *</label>
                    <input
                      type="number" required
                      className="mt-1 block w-full dark-input p-2 rounded-md text-neon-green font-bold"
                      value={formData.importPrice}
                      onChange={(e) => setFormData({ ...formData, importPrice: Number(e.target.value) })}
                    />
                  </div>
                )}
                
                {activeTab === 'SHOP' ? (
                  <div>
                    <label className="block text-sm font-medium text-dark-muted">Shop chuyển lên *</label>
                    <select
                      required
                      className="mt-1 block w-full dark-input p-2 rounded-md"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    >
                      <option value="">-- Chọn Shop --</option>
                      <option value="XStore">XStore</option>
                      <option value="PH_DN">PH_DN</option>
                      <option value="PH_HUE">PH_HUE</option>
                      <option value="PH_QNG">PH_QNG</option>
                    </select>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-dark-muted">Tên Khách Hàng *</label>
                      <input
                        type="text" required
                        className="mt-1 block w-full dark-input p-2 rounded-md"
                        placeholder="Họ tên khách hàng"
                        value={formData.customerInfo}
                        onChange={(e) => setFormData({ ...formData, customerInfo: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-muted">Số Điện Thoại *</label>
                      <input
                        type="text" required
                        className="mt-1 block w-full dark-input p-2 rounded-md"
                        placeholder="090..."
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-muted">
                  {activeTab === 'SHOP' ? 'Tình trạng lỗi shop báo' : 'Tình trạng máy & Yêu cầu khách'}
                </label>
                <textarea
                  className="mt-1 block w-full dark-input p-2 rounded-md"
                  rows={4}
                  placeholder="Mô tả chi tiết tình trạng máy khi nhận..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="neon-button px-8 py-3 rounded-lg font-bold flex items-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Xác Nhận Tiếp Nhận
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Cột phải: Lịch sử & Ghi chú */}
        <div className="space-y-6">
          {foundDevice && (
            <div className="bg-dark-card p-6 rounded-xl border border-neon-cyan/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
              <h3 className="text-lg font-semibold text-neon-cyan mb-4 flex items-center">
                <History className="w-5 h-5 mr-2" />
                Lịch Sử Máy
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-muted">Ngày nhập:</span>
                  <span className="text-dark-text">{foundDevice.importDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-muted">Nguồn gốc:</span>
                  <span className="text-dark-text">{foundDevice.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-muted">Trạng thái cũ:</span>
                  <span className="text-dark-text">{foundDevice.status}</span>
                </div>
                <div className="mt-4 p-3 bg-dark-bg rounded border border-dark-border">
                  <p className="text-xs font-bold text-dark-muted uppercase mb-1">Ghi chú cũ:</p>
                  <p className="text-xs text-dark-text italic">{foundDevice.notes || "Không có ghi chú cũ"}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-dark-card p-6 rounded-xl border border-dark-border">
            <h3 className="text-lg font-semibold text-dark-text mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
              Quy Trình Xử Lý
            </h3>
            <ul className="space-y-4 text-sm text-dark-muted">
              <li className="flex items-start">
                <span className="w-5 h-5 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center text-[10px] font-bold mr-3 mt-0.5">1</span>
                <span>Máy nhận từ Shop sẽ chuyển sang mục **Test Đầu Vào** để kiểm tra lại lỗi.</span>
              </li>
              <li className="flex items-start">
                <span className="w-5 h-5 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center text-[10px] font-bold mr-3 mt-0.5">2</span>
                <span>Máy Bảo Hành sẽ được ưu tiên kiểm tra lỗi ngay để phản hồi khách hàng.</span>
              </li>
              <li className="flex items-start">
                <span className="w-5 h-5 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center text-[10px] font-bold mr-3 mt-0.5">3</span>
                <span>Máy Sửa Lẻ sẽ chuyển thẳng sang mục **Điều Phối** để giao cho kỹ thuật xử lý.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
