import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../store/AppContext";
import { DeviceLocation } from "../types";
import { Table, LayoutDashboard, Smartphone, MapPin, User } from "lucide-react";

const APPEARANCES = ['LN', '99%', 'OTHER'] as const;

const APPEARANCE_LABELS: Record<string, string> = {
  'LN': 'Like New',
  '99%': '99%',
  'OTHER': 'Chưa phân loại'
};

export default function InventoryMatrix() {
  const { state } = useAppContext();
  const navigate = useNavigate();

  // Filter devices: only KHO_TONG and specific sources
  const activeDevices = useMemo(() => {
    return state.devices.filter(d => {
      // 1. Not sold
      if (d.status === 'DA_BAN') return false;
      
      // 2. Only KHO_TONG (handle undefined as KHO_TONG)
      const isAtKhoTong = !d.location || d.location === 'KHO_TONG';
      if (!isAtKhoTong) return false;

      // 3. Source filter: Only IMPORT (Nhập mới), SHOP_TRANSFER (Shop chuyển lên), TRADE_IN (Thu cũ)
      // Exclude: WARRANTY (Bảo hành), SERVICE (Sửa lẻ)
      const allowedSources = ['IMPORT', 'SHOP_TRANSFER', 'TRADE_IN'];
      
      // If receptionType is missing, we assume it's a standard import (NHAP_MOI)
      // unless it's explicitly one of the excluded types
      if (d.receptionType && !allowedSources.includes(d.receptionType)) return false;
      
      return true;
    });
  }, [state.devices]);

  // Helper to get holder ID for a device
  const getDeviceHolder = (device: any) => {
    const activeTask = state.tasks.find(t => t.deviceId === device.id && !['DONG_TASK', 'HUY_TASK'].includes(t.status));
    return activeTask?.assigneeId || 'KHO_TONG';
  };

  // Get unique holders (Users who have devices or 'KHO_TONG')
  const holders = useMemo(() => {
    const holderIds = new Set<string>();
    activeDevices.forEach(d => {
      holderIds.add(getDeviceHolder(d));
    });
    
    const sortedHolders = Array.from(holderIds).sort((a, b) => {
      if (a === 'KHO_TONG') return -1;
      if (b === 'KHO_TONG') return 1;
      const userA = state.users.find(u => u.id === a);
      const userB = state.users.find(u => u.id === b);
      return (userA?.name || '').localeCompare(userB?.name || '');
    });

    return sortedHolders;
  }, [activeDevices, state.users, state.tasks]);

  const getHolderName = (id: string) => {
    if (id === 'KHO_TONG') return 'Kho Tổng';
    const user = state.users.find(u => u.id === id);
    return user ? user.name : id;
  };

  // Get unique models and sort them
  const models = useMemo(() => {
    const uniqueModels = Array.from(new Set(activeDevices.map(d => d.model))) as string[];
    return uniqueModels.sort((a, b) => {
      const getNum = (s: string) => {
        const match = s.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      };
      const numA = getNum(a);
      const numB = getNum(b);
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
  }, [activeDevices]);

  // Grouping logic: model -> holder -> appearance -> [imeis]
  const matrixData = useMemo(() => {
    const data: Record<string, Record<string, Record<string, string[]>>> = {};

    models.forEach(model => {
      data[model] = {};
      holders.forEach(h => {
        data[model][h] = {};
        APPEARANCES.forEach(app => {
          data[model][h][app] = [];
        });
      });
    });

    activeDevices.forEach(d => {
      const holder = getDeviceHolder(d);
      let app = d.appearance;
      if (!app || !['LN', '99%'].includes(app)) {
        app = 'OTHER';
      }

      if (data[d.model] && data[d.model][holder]) {
        data[d.model][holder][app as any].push(d.imei);
      }
    });

    return data;
  }, [activeDevices, models, holders, state.tasks]);

  const visibleAppearances = useMemo(() => {
    const hasOtherData = models.some(model => 
      holders.some(holder => matrixData[model][holder]['OTHER'].length > 0)
    );
    return hasOtherData ? APPEARANCES : APPEARANCES.filter(a => a !== 'OTHER');
  }, [matrixData, models, holders]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neon-cyan neon-text flex items-center">
            <Table className="w-6 h-6 mr-2" />
            Báo Cáo Tồn Kho Ma Trận
          </h1>
          <p className="text-dark-muted text-sm mt-1">
            Thống kê tồn kho tại Kho Tổng (Nguồn: Nhập mới, Shop chuyển & Thu cũ). Phân loại theo Người giữ máy và Tình trạng.
          </p>
        </div>
      </div>

      <div className="bg-dark-card rounded-xl border border-dark-border overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse text-xs">
            <thead>
              {/* Level 1 Headers: Holders */}
              <tr className="bg-dark-bg/50">
                <th rowSpan={2} className="p-4 border border-dark-border text-left font-bold text-dark-text min-w-[150px] sticky left-0 bg-dark-card z-20">
                  Dòng Máy
                </th>
                {holders.map(h => (
                  <th key={h} colSpan={visibleAppearances.length} className="p-2 border border-dark-border text-center font-bold text-neon-cyan bg-dark-bg/30">
                    <div className="flex items-center justify-center">
                      <User className="w-3 h-3 mr-1" />
                      {getHolderName(h)}
                    </div>
                  </th>
                ))}
                <th rowSpan={2} className="p-4 border border-dark-border text-center font-bold text-dark-text bg-dark-bg/50">
                  Tổng Tồn
                </th>
              </tr>
              {/* Level 2 Headers: Appearances */}
              <tr className="bg-dark-bg/20">
                {holders.map(h => (
                  visibleAppearances.map(app => (
                    <th key={`${h}-${app}`} className="p-2 border border-dark-border text-center font-bold text-dark-muted min-w-[100px]">
                      {APPEARANCE_LABELS[app]}
                    </th>
                  ))
                ))}
              </tr>
            </thead>
            <tbody>
              {models.map(model => {
                let modelTotal = 0;
                return (
                  <tr key={model} className="hover:bg-dark-border/30 transition-colors group">
                    <td className="p-3 border border-dark-border font-bold text-dark-text sticky left-0 bg-dark-card group-hover:bg-dark-border/50 z-10">
                      {model}
                    </td>
                    {holders.map(h => (
                      visibleAppearances.map(app => {
                        const imeis = matrixData[model][h][app];
                        modelTotal += imeis.length;
                        return (
                          <td key={`${model}-${h}-${app}`} className="p-2 border border-dark-border align-top">
                            {imeis.length > 0 ? (
                              <div className="space-y-1">
                                <div className="flex flex-col gap-1">
                                  {imeis.map(imei => (
                                    <button 
                                      key={imei} 
                                      onClick={() => navigate(`/thiet-bi/${imei}`)}
                                      className="text-[12px] font-bold text-neon-cyan font-mono bg-dark-bg px-2 py-1 rounded border border-neon-cyan/30 hover:border-neon-cyan/80 hover:text-white transition-colors shadow-sm text-left"
                                    >
                                      {imei}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-dark-muted/20">-</span>
                            )}
                          </td>
                        );
                      })
                    ))}
                    <td className="p-3 border border-dark-border text-center font-bold text-neon-cyan bg-dark-bg/10">
                      {modelTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-dark-bg/50 font-bold">
                <td className="p-3 border border-dark-border sticky left-0 bg-dark-card">TỔNG CỘNG</td>
                {holders.map(h => (
                  visibleAppearances.map(app => {
                    const total = models.reduce((sum, model) => sum + matrixData[model][h][app].length, 0);
                    return (
                      <td key={`total-${h}-${app}`} className="p-3 border border-dark-border text-center text-neon-cyan">
                        {total}
                      </td>
                    );
                  })
                ))}
                <td className="p-3 border border-dark-border text-center text-neon-green text-lg">
                  {activeDevices.length}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-card p-4 rounded-xl border border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-dark-muted uppercase">Tổng máy tồn kho</span>
            <Smartphone className="w-4 h-4 text-neon-cyan" />
          </div>
          <div className="text-2xl font-bold text-dark-text">{activeDevices.length}</div>
        </div>
        <div className="bg-dark-card p-4 rounded-xl border border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-dark-muted uppercase">Số lượng Model</span>
            <LayoutDashboard className="w-4 h-4 text-neon-pink" />
          </div>
          <div className="text-2xl font-bold text-dark-text">{models.length}</div>
        </div>
        <div className="bg-dark-card p-4 rounded-xl border border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-dark-muted uppercase">Người quản lý</span>
            <User className="w-4 h-4 text-neon-green" />
          </div>
          <div className="text-2xl font-bold text-dark-text">{holders.length}</div>
        </div>
      </div>
    </div>
  );
}
