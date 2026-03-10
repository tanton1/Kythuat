import React, { useState, useMemo } from "react";
import { useAppContext } from "../store/AppContext";
import { Search, Filter, FileText, Calendar, DollarSign, Package, User, Store, Copy, Edit, Trash2, UserPlus } from "lucide-react";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function PhieuNhapHang() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  
  const [searchImei, setSearchImei] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeSource, setActiveSource] = useState('Tất cả');
  
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const PREDEFINED_SOURCES = [
    'Nguồn thu cũ',
    'Nguồn shop chuyển lên',
    'Nguồn bảo hành',
    'Nguồn khách lẻ'
  ];

  const suppliers = useMemo(() => {
    const s = new Set<string>();
    PREDEFINED_SOURCES.forEach(src => s.add(src));
    state.importReceipts.forEach(r => {
      // Don't add dynamically if it's one of the predefined sources or starts with shop transfer
      if (!PREDEFINED_SOURCES.includes(r.supplierName) && !r.supplierName.startsWith('Nguồn shop chuyển lên')) {
        s.add(r.supplierName);
      }
    });
    return ['Tất cả', ...Array.from(s)];
  }, [state.importReceipts]);

  const filteredReceipts = useMemo(() => {
    return state.importReceipts.filter(receipt => {
      // 1. Lọc theo nguồn nhập
      if (activeSource !== 'Tất cả') {
        if (activeSource === 'Nguồn shop chuyển lên') {
          if (!receipt.supplierName.startsWith('Nguồn shop chuyển lên')) return false;
        } else {
          if (receipt.supplierName !== activeSource) return false;
        }
      }

      // 2. Lọc chung (IMEI, NCC, Model, Mã phiếu, Người nhập, Ghi chú)
      if (searchImei) {
        const searchTerm = searchImei.toLowerCase();
        const hasImei = receipt.items.some(item => item.imei.toLowerCase().includes(searchTerm));
        const hasSupplier = receipt.supplierName.toLowerCase().includes(searchTerm);
        const hasProduct = receipt.items.some(item => item.model.toLowerCase().includes(searchTerm));
        const hasReceiptId = receipt.id.toLowerCase().includes(searchTerm);
        const hasNotes = receipt.notes?.toLowerCase().includes(searchTerm);
        
        const receiver = state.users.find(u => u.id === receipt.receiverId);
        const hasReceiver = receiver?.name.toLowerCase().includes(searchTerm);
        
        if (!hasImei && !hasSupplier && !hasProduct && !hasReceiptId && !hasNotes && !hasReceiver) return false;
      }
      
      // 3. Lọc theo khung thời gian
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
  }, [state.importReceipts, searchImei, dateFrom, dateTo, activeSource]);

  const totalImportAmount = filteredReceipts.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalItems = filteredReceipts.reduce((sum, r) => sum + r.items.length, 0);

  const handleDelete = (receipt: any) => {
    if (window.confirm(`Bạn có chắc chắn muốn xoá phiếu nhập ${receipt.id.split('-')[1]}?\nCảnh báo: Tất cả các máy trong phiếu nhập này cũng sẽ bị xoá khỏi kho (nếu chưa bán).`)) {
      // Find all IMEIs in this receipt
      const imeis = receipt.items.map((item: any) => item.imei);
      
      // Delete devices that match these IMEIs
      state.devices.forEach(device => {
        if (imeis.includes(device.imei)) {
          dispatch({ type: "DELETE_DEVICE", payload: device.id });
        }
      });
      
      // Delete the receipt
      dispatch({ type: "DELETE_IMPORT_RECEIPT", payload: receipt.id });
      alert("Đã xoá phiếu nhập và các máy liên quan.");
    }
  };

  const handleCopy = (receipt: any) => {
    // Navigate to TiepNhan with state
    navigate('/tiep-nhan', { 
      state: { 
        copyFromReceipt: receipt 
      } 
    });
  };

  const handleEdit = (receipt: any) => {
    navigate('/tiep-nhan', {
      state: {
        editReceipt: receipt
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-dark-text flex items-center">
          <FileText className="w-6 h-6 mr-2 text-neon-cyan" />
          Phiếu Nhập Hàng
        </h1>
        <button
          onClick={() => navigate('/tiep-nhan')}
          className="flex items-center px-4 py-2 bg-neon-cyan text-black font-semibold rounded-lg hover:bg-cyan-400 transition-colors"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Nhập Hàng
        </button>
      </div>

      {/* Tabs theo nguồn nhập */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {suppliers.map(source => (
          <button
            key={source}
            onClick={() => setActiveSource(source)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeSource === source ? 'bg-neon-cyan text-black' : 'bg-dark-card text-dark-muted hover:text-dark-text'}`}
          >
            {source}
          </button>
        ))}
      </div>

      {/* Bộ lọc tìm kiếm */}
      <div className="bg-dark-card p-4 rounded-xl border border-dark-border">
        <div className="flex items-center mb-4 text-neon-cyan">
          <Filter className="w-5 h-5 mr-2" />
          <h2 className="font-semibold">Tìm kiếm & Bộ lọc</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-dark-muted mb-1">Tìm kiếm chung (Mã phiếu, IMEI, NCC, Model, Người nhập...)</label>
            <div className="relative">
              <input
                type="text"
                className="w-full dark-input p-2 pl-8 rounded-md text-sm"
                placeholder="Nhập từ khoá..."
                value={searchImei} // Reusing searchImei state for general search for now, or I should add a new state
                onChange={(e) => setSearchImei(e.target.value)}
              />
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-dark-muted" />
            </div>
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
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => setSelectedReceipt(receipt)}
                            className="text-neon-cyan hover:text-white transition-colors"
                            title="Chi tiết"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleCopy(receipt)}
                            className="text-neon-green hover:text-white transition-colors"
                            title="Sao chép"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEdit(receipt)}
                            className="text-yellow-400 hover:text-white transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(receipt)}
                            className="text-neon-pink hover:text-white transition-colors"
                            title="Xoá"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
