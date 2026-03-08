import React, { useState } from "react";
import { useAppContext } from "../store/AppContext";
import { DollarSign, TrendingUp, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval, parse } from "date-fns";

export default function BaoCaoThuNhap() {
  const { state } = useAppContext();
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });

  const isTechnician = state.currentUser?.role === "KY_THUAT";
  const targetTechId = isTechnician ? state.currentUser?.id : null;

  // Filter tasks that have commission and are completed (passed QC)
  const completedTasks = state.tasks.filter(task => {
    const isCompleted = task.status === "DONG_TASK";
    const isTargetTech = targetTechId ? task.assigneeId === targetTechId : true;
    
    if (!isCompleted || !isTargetTech || !task.commission) return false;

    try {
      const taskDate = parse(task.createdAt.split(" ")[0], "yyyy-MM-dd", new Date());
      return isWithinInterval(taskDate, {
        start: parse(dateRange.start, "yyyy-MM-dd", new Date()),
        end: parse(dateRange.end, "yyyy-MM-dd", new Date()),
      });
    } catch (e) {
      return false;
    }
  });

  const totalCommission = completedTasks.reduce((sum, t) => sum + (t.commission || 0), 0);
  const pendingTasks = state.tasks.filter(t => 
    t.status !== "DONG_TASK" && 
    t.status !== "HUY_TASK" && 
    (targetTechId ? t.assigneeId === targetTechId : true)
  );
  const potentialCommission = pendingTasks.reduce((sum, t) => sum + (t.commission || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neon-cyan neon-text flex items-center">
          <DollarSign className="w-6 h-6 mr-2" />
          Báo Cáo Thu Nhập {isTechnician ? "" : "Kỹ Thuật"}
        </h1>
        <div className="flex items-center space-x-2 bg-dark-card p-2 rounded-lg border border-dark-border">
          <Calendar className="w-4 h-4 text-dark-muted" />
          <input 
            type="date" 
            className="bg-transparent text-xs text-dark-text focus:outline-none"
            value={dateRange.start}
            onChange={e => setDateRange({...dateRange, start: e.target.value})}
          />
          <span className="text-dark-muted">-</span>
          <input 
            type="date" 
            className="bg-transparent text-xs text-dark-text focus:outline-none"
            value={dateRange.end}
            onChange={e => setDateRange({...dateRange, end: e.target.value})}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-card p-6 rounded-xl border border-neon-green/30 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-16 h-16 text-neon-green" />
          </div>
          <p className="text-sm font-medium text-dark-muted uppercase tracking-wider">Tổng Hoa Hồng Thực Nhận</p>
          <p className="text-3xl font-bold text-neon-green mt-2">{totalCommission.toLocaleString('vi-VN')} đ</p>
          <div className="mt-4 flex items-center text-xs text-dark-muted">
            <CheckCircle2 className="w-4 h-4 mr-1 text-neon-green" />
            Dựa trên {completedTasks.length} task đã hoàn thành & đóng
          </div>
        </div>

        <div className="bg-dark-card p-6 rounded-xl border border-neon-cyan/30 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-16 h-16 text-neon-cyan" />
          </div>
          <p className="text-sm font-medium text-dark-muted uppercase tracking-wider">Hoa Hồng Đang Chờ (Dự Kiến)</p>
          <p className="text-3xl font-bold text-neon-cyan mt-2">{potentialCommission.toLocaleString('vi-VN')} đ</p>
          <div className="mt-4 flex items-center text-xs text-dark-muted">
            <AlertCircle className="w-4 h-4 mr-1 text-neon-cyan" />
            Từ {pendingTasks.length} task đang xử lý hoặc chờ QC
          </div>
        </div>

        <div className="bg-dark-card p-6 rounded-xl border border-dark-border shadow-lg flex flex-col justify-center">
          <p className="text-sm font-medium text-dark-muted text-center">Hiệu suất hoàn thành</p>
          <div className="mt-4 flex justify-center">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path className="text-dark-border" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                <path className="text-neon-green" strokeDasharray={`${(completedTasks.length / (completedTasks.length + pendingTasks.length || 1)) * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-dark-text">
                {Math.round((completedTasks.length / (completedTasks.length + pendingTasks.length || 1)) * 100)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border">
        <div className="p-4 border-b border-dark-border bg-dark-bg/50">
          <h3 className="text-lg font-medium text-dark-text">Chi tiết các khoản hoa hồng</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full dark-table">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ngày</th>
                {!isTechnician && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Kỹ Thuật</th>}
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Loại Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Thiết Bị</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Trạng Thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Hoa Hồng</th>
              </tr>
            </thead>
            <tbody>
              {completedTasks.map((task) => {
                const device = state.devices.find(d => d.id === task.deviceId);
                const tech = state.users.find(u => u.id === task.assigneeId);
                return (
                  <tr key={task.id} className="hover:bg-dark-border/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                      {task.createdAt.split(" ")[0]}
                    </td>
                    {!isTechnician && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neon-cyan font-medium">
                        {tech?.name}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                      {task.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-muted">
                      {device?.model} ({device?.imei.slice(-4)})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-neon-green/10 text-neon-green border border-neon-green/30">
                        ĐÃ ĐÓNG
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-neon-green font-bold">
                      +{task.commission?.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                );
              })}
              {completedTasks.length === 0 && (
                <tr>
                  <td colSpan={isTechnician ? 5 : 6} className="px-6 py-8 text-center text-sm text-dark-muted">
                    Chưa có dữ liệu hoa hồng trong khoảng thời gian này.
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
