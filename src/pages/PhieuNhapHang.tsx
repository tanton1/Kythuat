import React, { useState, useMemo } from "react";
import { useAppContext } from "../store/AppContext";
import { Search, Filter, FileText, Calendar, DollarSign, Package, User, Store } from "lucide-react";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";

export default function PhieuNhapHang() {
  const { state } = useAppContext();
  
  const [searchImei, setSearchImei] = useState("");
  const [searchSupplier, setSearchSupplier] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const filteredReceipts = useMemo(() => {
    return state.importReceipts.filter(receipt => {
      // 1. Lọc theo IMEI
      if (searchImei) {
        const hasImei = receipt.items.some(item => item.imei.toLowerCase().includes(searchImei.toLowerCase()));
        if (!hasImei) return false;
      }
      
      // 2. Lọc theo NCC
      if (searchSupplier && !receipt.supplierName.toLowerCase().includes(searchSupplier.toLowerCase())) {
        return false;
      }
      
      // 3. Lọc theo Hàng hoá (Model)
      if (searchProduct) {
        const hasProduct = receipt.items.some(item => item.model.toLowerCase().includes(searchProduct.toLowerCase()));
        if (!hasProduct) return false;
      }
      
      // 4. Lọc theo khung thời gian
      if (dateFrom || dateTo) {
        try {
          const receiptDate = parseISO(receipt.importDate.replace(' ', 'T'));
          const start = dateFrom ? startOfDay(new Date(dateFrom)) : new Date(0);
          const end = dateTo ? endOfDay(new Date(dateTo)) : new Date(8640000000000000);
          
          if (!isWithinInterval(receiptDate, { start, end })) {
            return false;
          }
        } catch (e) {
          // Fallback if date parsing fails
        }
      }
      
      return true;
    }).sort((a, b) => new Date(b.importDate).getTime() - new Date(a.importDate).getTime());
  }, [state.importReceipts, searchImei, searchSupplier, searchProduct, dateFrom, dateTo]);

  const totalImportAmount = filteredReceipts.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalItems = filteredReceipts.reduce((sum, r) => sum + r.items.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-dark-text flex items-center">
          <FileText className="w-6 h-6 mr-2 text-neon-cyan" />
          Phiếu Nhập Hàng
        </h1>
      </div>

      {/* Bộ lọc nâng cao */}
      <div className="bg-dark-card p-4 rounded-xl border border-dark-border">
        <div className="flex items-center mb-4 text-neon-cyan">
          <Filter className="w-5 h-5 mr-2" />
          <h2 className="font-semibold">Bộ lọc tìm kiếm</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-dark-muted mb-1">IMEI</label>
            <div className="relative">
              <input
                type="text"
                className="w-full dark-input p-2 pl-8 rounded-md text-sm"
                placeholder="Tìm theo IMEI..."
                value={searchImei}
                onChange={(e) => setSearchImei(e.target.value)}
              />
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-dark-muted" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-dark-muted mb-1">Nhà cung cấp</label>
            <input
              type="text"
              className="w-full dark-input p-2 rounded-md text-sm"
              placeholder="Tên NCC..."
              value={searchSupplier}
              onChange={(e) => setSearchSupplier(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-dark-muted mb-1">Hàng hoá (Model)</label>
            <input
              type="text"
              className="w-full dark-input p-2 rounded-md text-sm"
              placeholder="VD: iPhone 13 Pro Max..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-dark-muted mb-1">Từ ngày</label>
            <input
              type="date"
              className="w-full dark-input p-2 rounded-md text-sm"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-dark-muted mb-1">Đến ngày</label>
            <input
              type="date"
              className="w-full dark-input p-2 rounded-md text-sm"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-card p-4 rounded-xl border border-dark-border flex items-center">
          <div className="p-3 bg-neon-cyan/10 rounded-lg mr-4">
            <FileText className="w-6 h-6 text-neon-cyan" />
          </div>
          <div>
            <p className="text-sm text-dark-muted">Tổng số phiếu</p>
            <p className="text-xl font-bold text-dark-text">{filteredReceipts.length}</p>
          </div>
        </div>
        <div className="bg-dark-card p-4 rounded-xl border border-dark-border flex items-center">
          <div className="p-3 bg-neon-purple/10 rounded-lg mr-4">
            <Package className="w-6 h-6 text-neon-purple" />
          </div>
          <div>
            <p className="text-sm text-dark-muted">Tổng số lượng máy</p>
            <p className="text-xl font-bold text-dark-text">{totalItems}</p>
          </div>
        </div>
        <div className="bg-dark-card p-4 rounded-xl border border-dark-border flex items-center">
          <div className="p-3 bg-neon-green/10 rounded-lg mr-4">
            <DollarSign className="w-6 h-6 text-neon-green" />
          </div>
          <div>
            <p className="text-sm text-dark-muted">Tổng tiền nhập</p>
            <p className="text-xl font-bold text-neon-green">{totalImportAmount.toLocaleString()} đ</p>
          </div>
        </div>
      </div>

      {/* Danh sách phiếu nhập */}
      <div className="bg-dark-card rounded-xl border border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-bg text-dark-muted text-sm border-b border-dark-border">
                <th className="px-4 py-3 font-medium">Mã Phiếu</th>
                <th className="px-4 py-3 font-medium">Ngày Nhập</th>
                <th className="px-4 py-3 font-medium">Nhà Cung Cấp</th>
                <th className="px-4 py-3 font-medium">Số Lượng</th>
                <th className="px-4 py-3 font-medium">Tổng Tiền</th>
                <th className="px-4 py-3 font-medium">Người Nhập</th>
                <th className="px-4 py-3 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {filteredReceipts.length > 0 ? (
                filteredReceipts.map((receipt) => {
                  const receiver = state.users.find(u => u.id === receipt.receiverId);
                  return (
                    <tr key={receipt.id} className="hover:bg-dark-bg/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-neon-cyan">{receipt.id.split('-')[1]}</td>
                      <td className="px-4 py-3 text-sm text-dark-text">{receipt.importDate}</td>
                      <td className="px-4 py-3 text-sm text-dark-text font-medium">{receipt.supplierName}</td>
                      <td className="px-4 py-3 text-sm text-dark-text">{receipt.items.length} máy</td>
                      <td className="px-4 py-3 text-sm font-medium text-neon-green">{receipt.totalAmount.toLocaleString()} đ</td>
                      <td className="px-4 py-3 text-sm text-dark-muted">{receiver?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm">
                        <button 
                          onClick={() => setSelectedReceipt(receipt)}
                          className="text-neon-cyan hover:underline"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-dark-muted">
                    Không tìm thấy phiếu nhập nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Chi Tiết Phiếu Nhập */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-card rounded-xl border border-dark-border w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-dark-border flex justify-between items-center bg-dark-bg">
              <h2 className="text-xl font-bold text-dark-text flex items-center">
                <FileText className="w-5 h-5 mr-2 text-neon-cyan" />
                Chi Tiết Phiếu Nhập: {selectedReceipt.id.split('-')[1]}
              </h2>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="text-dark-muted hover:text-neon-pink transition-colors"
              >
                Đóng
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-dark-bg p-3 rounded-lg border border-dark-border">
                  <p className="text-xs text-dark-muted mb-1 flex items-center"><Calendar className="w-3 h-3 mr-1"/> Ngày nhập</p>
                  <p className="text-sm font-medium text-dark-text">{selectedReceipt.importDate}</p>
                </div>
                <div className="bg-dark-bg p-3 rounded-lg border border-dark-border">
                  <p className="text-xs text-dark-muted mb-1 flex items-center"><Store className="w-3 h-3 mr-1"/> Nhà cung cấp</p>
                  <p className="text-sm font-medium text-dark-text">{selectedReceipt.supplierName}</p>
                </div>
                <div className="bg-dark-bg p-3 rounded-lg border border-dark-border">
                  <p className="text-xs text-dark-muted mb-1 flex items-center"><User className="w-3 h-3 mr-1"/> Người nhập</p>
                  <p className="text-sm font-medium text-dark-text">
                    {state.users.find(u => u.id === selectedReceipt.receiverId)?.name || 'Unknown'}
                  </p>
                </div>
                <div className="bg-dark-bg p-3 rounded-lg border border-dark-border">
                  <p className="text-xs text-dark-muted mb-1 flex items-center"><DollarSign className="w-3 h-3 mr-1"/> Tổng tiền</p>
                  <p className="text-sm font-bold text-neon-green">{selectedReceipt.totalAmount.toLocaleString()} đ</p>
                </div>
              </div>

              {selectedReceipt.notes && (
                <div className="mb-6 bg-dark-bg p-3 rounded-lg border border-dark-border">
                  <p className="text-xs text-dark-muted mb-1">Ghi chú</p>
                  <p className="text-sm text-dark-text whitespace-pre-wrap">{selectedReceipt.notes}</p>
                </div>
              )}

              <h3 className="text-lg font-semibold text-neon-cyan mb-3 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Danh sách thiết bị ({selectedReceipt.items.length})
              </h3>
              
              <div className="border border-dark-border rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-dark-bg text-dark-muted text-xs uppercase tracking-wider border-b border-dark-border">
                      <th className="px-4 py-2 font-medium">STT</th>
                      <th className="px-4 py-2 font-medium">IMEI</th>
                      <th className="px-4 py-2 font-medium">Model</th>
                      <th className="px-4 py-2 font-medium">Màu / Dung lượng</th>
                      <th className="px-4 py-2 font-medium text-right">Giá Nhập</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {selectedReceipt.items.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-dark-bg/50">
                        <td className="px-4 py-2 text-sm text-dark-muted">{idx + 1}</td>
                        <td className="px-4 py-2 text-sm font-mono text-neon-cyan">{item.imei}</td>
                        <td className="px-4 py-2 text-sm text-dark-text font-medium">{item.model}</td>
                        <td className="px-4 py-2 text-sm text-dark-text">{item.color} {item.capacity && `- ${item.capacity}`}</td>
                        <td className="px-4 py-2 text-sm font-medium text-neon-green text-right">{item.importPrice.toLocaleString()} đ</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-dark-bg border-t border-dark-border">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-sm font-bold text-right text-dark-text">Tổng cộng:</td>
                      <td className="px-4 py-3 text-sm font-bold text-neon-green text-right">{selectedReceipt.totalAmount.toLocaleString()} đ</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
