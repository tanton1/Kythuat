import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../store/AppContext";
import { Device, Task } from "../types";
import { Settings, UserPlus, Clock, AlertTriangle } from "lucide-react";
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from "date-fns";

export default function DieuPhoi() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    type: "Thay Pin",
    description: "",
    priority: "NORMAL",
    assigneeId: "",
    deadline: format(new Date(Date.now() + 86400000), "yyyy-MM-dd'T'HH:mm"),
  });

  // Filters for Task Đang Chạy
  const [activeTechTab, setActiveTechTab] = useState<string>("ALL");
  const [taskSearchImei, setTaskSearchImei] = useState("");
  const [taskDateRangeType, setTaskDateRangeType] = useState("this_month");
  const [taskDateFrom, setTaskDateFrom] = useState("");
  const [taskDateTo, setTaskDateTo] = useState("");

  const pendingDevices = state.devices.filter(
    (d) => d.status === "CHO_PHAN_TASK",
  );
  const pendingIncidents = state.incidents.filter(
    (i) => i.status === "CHO_DUYET" || i.status === "PENDING"
  );
  const technicians = state.users.filter((u) => u.role === "KY_THUAT");
  const technicalTasks = state.products.filter(p => p.category === 'SERVICE');

  const filteredActiveTasks = React.useMemo(() => {
    return state.tasks.filter((t) => {
      if (["HOAN_THANH_CHO_QC", "DONG_TASK", "HUY_TASK"].includes(t.status)) return false;

      // Filter by technician
      if (activeTechTab !== "ALL" && t.assigneeId !== activeTechTab) return false;

      // Filter by IMEI
      const device = state.devices.find(d => d.id === t.deviceId);
      if (taskSearchImei && device && !device.imei.toLowerCase().includes(taskSearchImei.toLowerCase())) return false;

      // Filter by date
      if (taskDateRangeType !== 'all') {
        let start = new Date(0);
        let end = new Date(8640000000000000);
        const today = new Date();

        if (taskDateRangeType === 'today') {
          start = startOfDay(today);
          end = endOfDay(today);
        } else if (taskDateRangeType === 'yesterday') {
          const yesterday = subDays(today, 1);
          start = startOfDay(yesterday);
          end = endOfDay(yesterday);
        } else if (taskDateRangeType === 'this_week') {
          start = startOfWeek(today, { weekStartsOn: 1 });
          end = endOfWeek(today, { weekStartsOn: 1 });
        } else if (taskDateRangeType === 'this_month') {
          start = startOfMonth(today);
          end = endOfMonth(today);
        } else if (taskDateRangeType === 'last_month') {
          const lastMonth = subMonths(today, 1);
          start = startOfMonth(lastMonth);
          end = endOfMonth(lastMonth);
        } else if (taskDateRangeType === 'custom') {
          start = taskDateFrom ? startOfDay(new Date(taskDateFrom)) : new Date(0);
          end = taskDateTo ? endOfDay(new Date(taskDateTo)) : new Date(8640000000000000);
        }

        try {
          const taskDate = parseISO(t.createdAt.replace(' ', 'T'));
          if (!isWithinInterval(taskDate, { start, end })) {
            return false;
          }
        } catch (e) {
          // Fallback if date parsing fails
        }
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [state.tasks, state.devices, activeTechTab, taskSearchImei, taskDateRangeType, taskDateFrom, taskDateTo]);

  const activeTasks = state.tasks.filter(
    (t) => !["HOAN_THANH_CHO_QC", "DONG_TASK", "HUY_TASK"].includes(t.status),
  );

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !newTask.assigneeId)
      return alert("Vui lòng chọn máy và kỹ thuật viên");

    const selectedProduct = state.products.find(p => p.name === newTask.type);

    const task: Task = {
      id: `task-${Date.now()}`,
      deviceId: selectedDevice.id,
      type: newTask.type!,
      description: newTask.description || "",
      priority: newTask.priority as any,
      assigneeId: newTask.assigneeId!,
      assignerId: state.currentUser!.id,
      deadline: newTask.deadline!,
      status: "MOI_TAO",
      notes: "",
      createdAt: format(new Date(), "yyyy-MM-dd HH:mm"),
      commission: selectedProduct?.commission || 0,
    };

    dispatch({ type: "ADD_TASK", payload: task });

    // Add notification for technician
    dispatch({
      type: "ADD_NOTIFICATION",
      payload: {
        id: `noti-${Date.now()}`,
        userId: task.assigneeId,
        title: "Bạn có Task mới!",
        message: `Bạn vừa được giao task "${task.type}" cho máy ${selectedDevice.model}.`,
        type: "TASK_ASSIGNED",
        link: "/ky-thuat",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    });

    // Update device status if it's the first task
    if (selectedDevice.status === "CHO_PHAN_TASK") {
      dispatch({
        type: "UPDATE_DEVICE",
        payload: { ...selectedDevice, status: "DANG_XU_LY" },
      });
    }

    setNewTask({ ...newTask, description: "" });
    alert("Đã tạo task thành công!");
  };

  const handleResolveIncident = (incident: any, action: 'RESUME' | 'NEW_TASK') => {
    dispatch({ type: "UPDATE_INCIDENT", payload: { ...incident, status: "DA_DUYET", resolution: action } });
    
    const task = state.tasks.find(t => t.id === incident.taskId);
    const device = state.devices.find(d => d.id === incident.deviceId);

    if (action === 'RESUME') {
      if (task) {
        dispatch({ type: "UPDATE_TASK", payload: { ...task, status: "DANG_XU_LY" } });
        
        // Notify technician
        dispatch({
          type: "ADD_NOTIFICATION",
          payload: {
            id: `noti-${Date.now()}`,
            userId: task.assigneeId,
            title: "Sự cố đã được xử lý!",
            message: `Sự cố trên máy ${device?.model} đã được duyệt. Bạn có thể tiếp tục công việc.`,
            type: "TASK_UPDATED",
            link: "/ky-thuat",
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        });
      }
      if (device) dispatch({ type: "UPDATE_DEVICE", payload: { ...device, status: "DANG_XU_LY" } });
      alert("Đã cho phép tiếp tục task!");
    } else if (action === 'NEW_TASK') {
      if (device) {
        setSelectedDevice(device);
        setNewTask({ ...newTask, description: `[Xử lý sự cố]: ${incident.description}\n` });
      }
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neon-cyan neon-text">Điều Phối Kỹ Thuật</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Máy chờ phân task & Máy đang sửa */}
        <div className="space-y-6 col-span-1">
          {pendingIncidents.length > 0 && (
            <div className="bg-dark-card rounded-xl shadow-sm border border-neon-pink/50 overflow-hidden">
              <div className="p-4 border-b border-neon-pink/30 bg-neon-pink/10">
                <h3 className="text-lg font-medium text-neon-pink flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Sự Cố Cần Xử Lý ({pendingIncidents.length})
                </h3>
              </div>
              <div className="divide-y divide-dark-border max-h-[300px] overflow-y-auto">
                {pendingIncidents.map((incident) => {
                  const device = state.devices.find(d => d.id === incident.deviceId);
                  const task = state.tasks.find(t => t.id === incident.taskId);
                  const reporter = state.users.find(u => u.id === incident.reportedBy);
                  
                  return (
                    <div key={incident.id} className="p-4 bg-dark-bg">
                      <p className="font-medium text-neon-pink text-sm">Lỗi phát sinh: {incident.description}</p>
                      <p className="text-xs text-dark-muted mt-1">Máy: {device?.model} - {device?.imei.slice(-4)}</p>
                      <p className="text-xs text-dark-muted mt-1">Task đang làm: {task?.type}</p>
                      <p className="text-xs text-dark-muted mt-1">Báo cáo bởi: {reporter?.name}</p>
                      <div className="mt-3 flex space-x-2">
                        <button 
                          onClick={() => handleResolveIncident(incident, 'RESUME')} 
                          className="flex-1 px-2 py-1.5 text-xs bg-neon-green/10 text-neon-green rounded border border-neon-green/30 hover:bg-neon-green/20 transition-colors"
                        >
                          Tiếp tục Task
                        </button>
                        <button 
                          onClick={() => handleResolveIncident(incident, 'NEW_TASK')} 
                          className="flex-1 px-2 py-1.5 text-xs bg-neon-cyan/10 text-neon-cyan rounded border border-neon-cyan/30 hover:bg-neon-cyan/20 transition-colors"
                        >
                          Tạo Task Mới
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border overflow-hidden">
            <div className="p-4 border-b border-dark-border bg-yellow-500/10">
              <h3 className="text-lg font-medium text-yellow-500 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Cần Phân Task ({pendingDevices.length})
              </h3>
            </div>
            <div className="divide-y divide-dark-border max-h-[300px] overflow-y-auto">
              {pendingDevices.map((device) => (
                <div
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className={`p-4 cursor-pointer hover:bg-dark-border transition-colors ${selectedDevice?.id === device.id ? "bg-dark-bg border-l-4 border-yellow-500" : ""}`}
                >
                  <p className="font-medium text-dark-text">{device.model}</p>
                  <p className="text-xs text-dark-muted font-mono mt-1">
                    IMEI: <button onClick={(e) => { e.stopPropagation(); navigate(`/thiet-bi/${device.imei}`); }} className="text-neon-cyan hover:underline">{device.imei}</button>
                  </p>
                  <p className="text-xs text-neon-pink mt-2 line-clamp-2">
                    Lỗi: {device.notes.split("[TEST ĐẦU VÀO]:")[1] || "Chưa rõ"}
                  </p>
                </div>
              ))}
              {pendingDevices.length === 0 && (
                <div className="p-6 text-center text-dark-muted text-sm">
                  Không có máy chờ phân task.
                </div>
              )}
            </div>
          </div>


        </div>

        {/* Cột phải: Form tạo task */}
        <div className="col-span-2">
          {selectedDevice ? (
            <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border">
              <div className="p-6 border-b border-dark-border bg-dark-bg/50">
                <h2 className="text-xl font-semibold text-dark-text">
                  Tạo Task Mới
                </h2>
                <div className="mt-4 p-4 bg-dark-bg border border-dark-border rounded-lg">
                  <p className="font-medium text-dark-text">
                    {selectedDevice.model}
                  </p>
                  <p className="text-sm text-dark-muted font-mono">
                    IMEI: <button onClick={() => navigate(`/thiet-bi/${selectedDevice.imei}`)} className="text-neon-cyan hover:underline">{selectedDevice.imei}</button>
                  </p>
                  <div className="mt-3 text-sm text-yellow-500 bg-yellow-500/10 p-3 rounded border border-yellow-500/30">
                    <strong>Ghi chú test đầu vào:</strong>
                    <p className="mt-1 whitespace-pre-wrap">
                      {selectedDevice.notes.split("[TEST ĐẦU VÀO]:")[1] ||
                        selectedDevice.notes}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreateTask} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-dark-muted">
                      Loại Lỗi / Công Việc
                    </label>
                    <select
                      className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                      value={newTask.type}
                      onChange={(e) =>
                        setNewTask({ ...newTask, type: e.target.value })
                      }
                    >
                      <option value="">-- Chọn Task Kỹ Thuật --</option>
                      {technicalTasks.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                    {newTask.type && (
                      <p className="mt-1 text-xs text-neon-pink font-medium">
                        Hoa hồng KTV: {state.products.find(p => p.name === newTask.type)?.commission?.toLocaleString('vi-VN') || 0} đ
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-muted">
                      Mức Độ Ưu Tiên
                    </label>
                    <select
                      className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                      value={newTask.priority}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          priority: e.target.value as any,
                        })
                      }
                    >
                      <option value="LOW">Thấp (Làm sau)</option>
                      <option value="NORMAL">Bình thường</option>
                      <option value="HIGH">Cao (Khách đợi lấy ngay)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-muted">
                      Giao Cho Kỹ Thuật Viên
                    </label>
                    <select
                      required
                      className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                      value={newTask.assigneeId}
                      onChange={(e) =>
                        setNewTask({ ...newTask, assigneeId: e.target.value })
                      }
                    >
                      <option value="">-- Chọn Kỹ Thuật Viên --</option>
                      {technicians.map((tech) => {
                        const taskCount = activeTasks.filter(
                          (t) => t.assigneeId === tech.id,
                        ).length;
                        return (
                          <option key={tech.id} value={tech.id}>
                            {tech.name} ({taskCount} task đang làm)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-muted">
                      Deadline
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="mt-1 block w-full rounded-md sm:text-sm p-2 dark-input"
                      value={newTask.deadline}
                      onChange={(e) =>
                        setNewTask({ ...newTask, deadline: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-muted">
                    Mô tả chi tiết yêu cầu xử lý
                  </label>
                  <textarea
                    rows={4}
                    required
                    className="mt-1 block w-full rounded-md sm:text-sm p-3 dark-input"
                    placeholder="Ví dụ: Thay pin dung lượng cao, nhớ dán lại ron chống nước cẩn thận..."
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-dark-border">
                  <button
                    type="button"
                    onClick={() => setSelectedDevice(null)}
                    className="px-4 py-2 border border-dark-border rounded-md text-sm font-medium text-dark-muted hover:bg-dark-border hover:text-dark-text"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md shadow-sm text-sm font-medium neon-button flex items-center"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Giao Việc
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-dark-bg rounded-xl border border-dark-border border-dashed h-full min-h-[400px] flex flex-col items-center justify-center text-dark-muted">
              <Settings className="w-12 h-12 mb-4 text-dark-border" />
              <p>Chọn một máy bên trái để phân task</p>
            </div>
          )}
        </div>
      </div>

      {/* Task Đang Chạy Section */}
      <div className="bg-dark-card rounded-xl shadow-sm border border-dark-border overflow-hidden mt-6">
        <div className="p-4 border-b border-dark-border bg-neon-cyan/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-medium text-neon-cyan flex items-center whitespace-nowrap">
            <Settings className="w-5 h-5 mr-2" />
            Task Đang Chạy ({filteredActiveTasks.length})
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Tìm IMEI..."
              className="p-2 rounded-md bg-dark-bg border border-dark-border text-sm focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan outline-none"
              value={taskSearchImei}
              onChange={(e) => setTaskSearchImei(e.target.value)}
            />
            <select
              className="p-2 rounded-md bg-dark-bg border border-dark-border text-sm focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan outline-none"
              value={taskDateRangeType}
              onChange={(e) => setTaskDateRangeType(e.target.value)}
            >
              <option value="today">Hôm nay</option>
              <option value="yesterday">Hôm qua</option>
              <option value="this_week">Tuần này</option>
              <option value="this_month">Tháng này</option>
              <option value="last_month">Tháng trước</option>
              <option value="all">Tất cả thời gian</option>
              <option value="custom">Tuỳ chỉnh</option>
            </select>
            {taskDateRangeType === 'custom' && (
              <div className="flex gap-2">
                <input
                  type="date"
                  className="p-2 rounded-md bg-dark-bg border border-dark-border text-sm focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan outline-none"
                  value={taskDateFrom}
                  onChange={(e) => setTaskDateFrom(e.target.value)}
                />
                <input
                  type="date"
                  className="p-2 rounded-md bg-dark-bg border border-dark-border text-sm focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan outline-none"
                  value={taskDateTo}
                  onChange={(e) => setTaskDateTo(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Technician Tabs */}
        <div className="flex overflow-x-auto border-b border-dark-border bg-dark-bg">
          <button
            onClick={() => setActiveTechTab("ALL")}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTechTab === "ALL"
                ? "text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5"
                : "text-dark-muted hover:text-dark-text hover:bg-dark-border/50"
            }`}
          >
            Tất cả KTV
          </button>
          {technicians.map((tech) => (
            <button
              key={tech.id}
              onClick={() => setActiveTechTab(tech.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTechTab === tech.id
                  ? "text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5"
                  : "text-dark-muted hover:text-dark-text hover:bg-dark-border/50"
              }`}
            >
              {tech.name}
            </button>
          ))}
        </div>

        <div className="divide-y divide-dark-border max-h-[500px] overflow-y-auto">
          {filteredActiveTasks.map((task) => {
            const device = state.devices.find((d) => d.id === task.deviceId);
            const assignee = state.users.find((u) => u.id === task.assigneeId);
            return (
              <div key={task.id} className="p-4 bg-dark-bg hover:bg-dark-border/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-dark-text text-sm">
                      {task.type}
                    </p>
                    <p className="text-xs text-dark-muted mt-1">
                      Máy: {device?.model} - IMEI: <button onClick={() => navigate(`/thiet-bi/${device?.imei}`)} className="text-neon-cyan hover:underline">{device?.imei}</button>
                    </p>
                    <p className="text-xs text-dark-muted mt-1">
                      KTV: <span className="text-neon-cyan">{assignee?.name}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold bg-dark-border text-dark-muted px-2 py-0.5 rounded-full inline-block mb-2">
                      {task.status}
                    </span>
                    <p className="text-[10px] text-neon-pink flex items-center justify-end">
                      <Clock className="w-3 h-3 mr-1" />
                      Deadline: {task.deadline.replace('T', ' ')}
                    </p>
                    <p className="text-[10px] text-dark-muted mt-1">
                      Ngày tạo: {task.createdAt}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredActiveTasks.length === 0 && (
            <div className="p-8 text-center text-dark-muted">
              Không tìm thấy task nào phù hợp.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
