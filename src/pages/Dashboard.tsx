import React, { useMemo } from "react";
import { useAppContext } from "../store/AppContext";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench,
  AlertTriangle,
  DollarSign,
  Users
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const RECEPTION_TYPE_MAP: Record<string, string> = {
  IMPORT: "Nhập mới",
  TRADE_IN: "Thu cũ",
  WARRANTY: "Bảo hành",
  SERVICE: "Khách lẻ",
  SHOP_TRANSFER: "Shop chuyển",
};

const COLORS = ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff8800'];

export default function Dashboard() {
  const { state } = useAppContext();

  const totalDevices = state.devices.length;
  const pendingTest = state.devices.filter((d) => d.status === "CHO_TEST").length;
  const pendingDecision = state.devices.filter((d) => d.status === "CHO_QUYET_DINH").length;
  const pendingTask = state.devices.filter((d) => d.status === "CHO_PHAN_TASK").length;
  const inProgress = state.devices.filter((d) => d.status === "DANG_XU_LY").length;
  const pendingQC = state.devices.filter((d) => d.status === "CHO_QC").length;

  // 1. Biểu đồ số lượng máy kỹ thuật đang xử lý theo nguồn
  const devicesInProgress = state.devices.filter(d => 
    d.status === "DANG_XU_LY" || d.status === "CHO_LINH_KIEN"
  );
  
  const processingBySourceData = useMemo(() => {
    const counts: Record<string, number> = {
      IMPORT: 0,
      TRADE_IN: 0,
      WARRANTY: 0,
      SERVICE: 0,
      SHOP_TRANSFER: 0,
    };
    
    devicesInProgress.forEach(d => {
      if (d.receptionType && counts[d.receptionType] !== undefined) {
        counts[d.receptionType]++;
      } else {
        counts['IMPORT']++; // Default fallback
      }
    });

    return Object.entries(counts).map(([key, value]) => ({
      name: RECEPTION_TYPE_MAP[key] || key,
      value
    })).filter(item => item.value > 0);
  }, [devicesInProgress]);

  // 2. Máy chậm deadline
  const overdueTasks = useMemo(() => {
    const now = new Date();
    return state.tasks.filter(t => {
      if (t.status === "DONG_TASK" || t.status === "HUY_TASK" || t.status === "HOAN_THANH_CHO_QC") return false;
      if (!t.deadline) return false;
      return new Date(t.deadline) < now;
    }).map(t => {
      const device = state.devices.find(d => d.id === t.deviceId);
      const assignee = state.users.find(u => u.id === t.assigneeId);
      return { ...t, device, assignee };
    });
  }, [state.tasks, state.devices, state.users]);

  // 3. Hoa hồng team kỹ thuật
  const commissionData = useMemo(() => {
    const techUsers = state.users.filter(u => u.role === "KY_THUAT");
    const completedTasks = state.tasks.filter(t => t.status === "DONG_TASK" || t.status === "HOAN_THANH_CHO_QC");
    
    return techUsers.map(tech => {
      const tasksForTech = completedTasks.filter(t => t.assigneeId === tech.id);
      const totalCommission = tasksForTech.reduce((sum, t) => sum + (t.commission || 0), 0);
      return {
        name: tech.name,
        commission: totalCommission,
        taskCount: tasksForTech.length
      };
    }).filter(item => item.commission > 0 || item.taskCount > 0);
  }, [state.users, state.tasks]);

  const totalCommission = commissionData.reduce((sum, item) => sum + item.commission, 0);

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-2xl font-bold text-neon-cyan neon-text">Tổng Quan Hệ Thống</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Tổng Máy" value={totalDevices} icon={Activity} color="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30" />
        <StatCard title="Chờ Test" value={pendingTest} icon={Clock} color="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30" />
        <StatCard title="Chờ Quyết Định" value={pendingDecision} icon={AlertCircle} color="bg-neon-pink/10 text-neon-pink border border-neon-pink/30" />
        <StatCard title="Chờ Phân Task" value={pendingTask} icon={Clock} color="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30" />
        <StatCard title="Đang Sửa" value={inProgress} icon={Wrench} color="bg-neon-pink/10 text-neon-pink border border-neon-pink/30" />
        <StatCard title="Chờ QC" value={pendingQC} icon={CheckCircle} color="bg-neon-green/10 text-neon-green border border-neon-green/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Biểu đồ máy đang xử lý */}
        <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border p-6">
          <h2 className="text-lg font-semibold text-dark-text mb-4 flex items-center">
            <Wrench className="w-5 h-5 mr-2 text-neon-cyan" />
            Máy Đang Xử Lý Theo Nguồn ({devicesInProgress.length})
          </h2>
          {processingBySourceData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processingBySourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {processingBySourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#fff' }}
                    itemStyle={{ color: '#00ffff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-dark-muted">
              Không có máy đang xử lý
            </div>
          )}
        </div>

        {/* Biểu đồ hoa hồng */}
        <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-dark-text flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-neon-green" />
              Hoa Hồng Kỹ Thuật
            </h2>
            <span className="text-neon-green font-bold text-lg">
              {totalCommission.toLocaleString()}đ
            </span>
          </div>
          {commissionData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={commissionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                  <XAxis type="number" stroke="#888" tickFormatter={(value) => `${value / 1000}k`} />
                  <YAxis dataKey="name" type="category" stroke="#888" width={80} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()}đ`, 'Hoa hồng']}
                    contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#fff' }}
                  />
                  <Bar dataKey="commission" fill="#00ff00" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-dark-muted">
              Chưa có dữ liệu hoa hồng
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Danh sách máy chậm deadline */}
        <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-dark-text flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-neon-pink" />
              Máy Chậm Deadline
            </h2>
            <span className="bg-neon-pink/20 text-neon-pink px-3 py-1 rounded-full text-sm font-bold">
              {overdueTasks.length} máy
            </span>
          </div>
          
          {overdueTasks.length === 0 ? (
            <p className="text-dark-muted text-sm text-center py-8">Tuyệt vời! Không có máy nào chậm trễ.</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {overdueTasks.map((task) => (
                <div key={task.id} className="p-3 bg-dark-bg border border-neon-pink/30 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-dark-text">
                      {task.device?.model} - {task.device?.imei}
                    </p>
                    <span className="text-xs font-medium bg-neon-pink/10 text-neon-pink px-2 py-1 rounded">
                      {new Date(task.deadline).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-sm text-dark-muted mb-2 line-clamp-1">{task.description}</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-dark-muted">
                      KTV: <span className="text-neon-cyan">{task.assignee?.name || 'Chưa gán'}</span>
                    </span>
                    <span className="text-yellow-500">{task.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hoạt động gần đây */}
        <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border p-6">
          <h2 className="text-lg font-semibold text-dark-text mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-neon-cyan" />
            Máy Mới Tiếp Nhận
          </h2>
          {state.devices.length === 0 ? (
            <p className="text-dark-muted text-sm text-center py-8">Chưa có dữ liệu máy.</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {state.devices
                .slice(-8)
                .reverse()
                .map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 bg-dark-bg border border-dark-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-dark-text">
                        {device.model}
                      </p>
                      <p className="text-xs text-dark-muted mt-1">
                        IMEI: {device.imei}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium bg-dark-border text-dark-muted px-2 py-1 rounded-full block mb-1">
                        {device.status}
                      </span>
                      <span className="text-[10px] text-dark-muted">
                        {device.importDate}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border p-3 sm:p-6 flex items-center">
      <div className={`p-2 sm:p-3 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <div className="ml-3 sm:ml-4 overflow-hidden">
        <p className="text-[10px] sm:text-sm font-medium text-dark-muted truncate">{title}</p>
        <p className="text-lg sm:text-2xl font-semibold text-dark-text">{value}</p>
      </div>
    </div>
  );
}
