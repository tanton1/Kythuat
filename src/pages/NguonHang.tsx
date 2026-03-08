import React, { useState } from "react";
import { useAppContext } from "../store/AppContext";
import { Device } from "../types";
import { Search, Smartphone, Package, ArrowRightLeft, ShieldAlert, UserPlus, Store } from "lucide-react";

const RECEPTION_TYPE_MAP: Record<string, { label: string, icon: any, color: string }> = {
  IMPORT: { label: 'Nhập mới', icon: Package, color: 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10' },
  TRADE_IN: { label: 'Thu cũ đổi mới', icon: ArrowRightLeft, color: 'text-neon-pink border-neon-pink/30 bg-neon-pink/10' },
  WARRANTY: { label: 'Bảo hành', icon: ShieldAlert, color: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10' },
  SERVICE: { label: 'Dịch vụ/Sửa lẻ', icon: UserPlus, color: 'text-neon-green border-neon-green/30 bg-neon-green/10' },
  SHOP_TRANSFER: { label: 'Shop chuyển', icon: Store, color: 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10' },
};

export default function NguonHang() {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState<string>('IMPORT');
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDevices = state.devices.filter(d => {
    const matchesSearch = d.imei.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         d.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = d.receptionType === activeTab;
    const isCurrentStock = d.status !== 'DA_BAN' && d.status !== 'DA_TRA_NCC';
    
    return matchesSearch && matchesType && isCurrentStock;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h1 className="text-2xl font-bold text-neon-cyan neon-text flex items-center">
          <Package className="w-6 h-6 mr-2" />
          Hàng Hóa Theo Nguồn Đầu Vào
        </h1>
        <div className="relative w-full lg:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted" />
          <input
            type="text"
            placeholder="Tìm IMEI, Model..."
            className="w-full pl-9 pr-4 py-2 rounded-md text-sm dark-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-dark-card p-1 rounded-lg border border-dark-border overflow-hidden">
        <div className="flex overflow-x-auto p-1 gap-2">
          {Object.entries(RECEPTION_TYPE_MAP).map(([key, { label, icon: Icon }]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center whitespace-nowrap ${
                activeTab === key 
                  ? 'bg-neon-cyan text-dark-bg' 
                  : 'text-dark-muted hover:text-dark-text hover:bg-dark-border'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-card p-4 rounded-xl border border-dark-border">
          <p className="text-[10px] font-bold text-dark-muted uppercase mb-1">Số lượng tồn</p>
          <p className="text-lg font-bold text-dark-text">{filteredDevices.length} máy</p>
        </div>
        <div className="bg-dark-card p-4 rounded-xl border border-dark-border">
          <p className="text-[10px] font-bold text-dark-muted uppercase mb-1">Tổng vốn tồn</p>
          <p className="text-lg font-bold text-neon-cyan">
            {filteredDevices.reduce((sum, d) => sum + d.importPrice, 0).toLocaleString('vi-VN')} đ
          </p>
        </div>
        <div className="bg-dark-card p-4 rounded-xl border border-dark-border md:col-span-2">
          <p className="text-[10px] font-bold text-dark-muted uppercase mb-1">Mô tả nguồn</p>
          <p className="text-sm text-dark-text">
            {activeTab === 'IMPORT' && "Máy nhập số lượng lớn từ các Nhà cung cấp (NCC). Đây là nguồn hàng chính để kinh doanh."}
            {activeTab === 'TRADE_IN' && "Máy thu lại từ khách hàng lẻ khi họ có nhu cầu lên đời máy."}
            {activeTab === 'WARRANTY' && "Máy do các Shop gửi về hoặc khách mang đến để xử lý các vấn đề phát sinh sau bán hàng."}
            {activeTab === 'SERVICE' && "Khách hàng mang máy đến sửa chữa (không phải máy của hệ thống bán ra)."}
            {activeTab === 'SHOP_TRANSFER' && "Điều chuyển hàng hóa giữa các chi nhánh (ví dụ từ XStore về Kho Tổng để bảo trì)."}
          </p>
        </div>
      </div>

      <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="dark-table">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">IMEI</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Trạng Thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Vị Trí Hiện Tại</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ngày Nhận</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Giá Nhập</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device) => {
                // Determine current location
                const activeTask = state.tasks.find(t => t.deviceId === device.id && !['DONG_TASK', 'HUY_TASK'].includes(t.status));
                let currentLocation = 'Kho Tổng';
                if (activeTask) {
                  const assignee = state.users.find(u => u.id === activeTask.assigneeId);
                  currentLocation = assignee ? `KT: ${assignee.name}` : 'Kho Tổng';
                } else if (device.location && device.location !== 'KHO_TONG') {
                  currentLocation = device.location;
                }

                return (
                  <tr key={device.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">
                      <div className="flex items-center">
                        <Smartphone className="w-4 h-4 mr-2 text-neon-cyan" />
                        {device.imei}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                      {device.model} ({device.capacity})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-dark-bg border border-dark-border text-dark-muted">
                        {device.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text font-medium">
                      {currentLocation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                      {device.receptionDate || device.importDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neon-cyan font-bold">
                      {device.importPrice.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                );
              })}
              {filteredDevices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-dark-muted">
                    Không có máy nào thuộc nguồn này trong kho.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
