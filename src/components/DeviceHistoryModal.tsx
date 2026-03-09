import React from 'react';
import { XCircle, Wrench, DollarSign, MapPin, ClipboardCheck } from 'lucide-react';
import { Device, Task, Incident, QCReport, Part } from '../types';

interface DeviceHistoryModalProps {
  device: Device;
  tasks: Task[];
  incidents: Incident[];
  qcReports: QCReport[];
  parts: Part[];
  onClose: () => void;
}

export const DeviceHistoryModal: React.FC<DeviceHistoryModalProps> = ({
  device,
  tasks,
  incidents,
  qcReports,
  parts,
  onClose,
}) => {
  // Calculate repair history
  const deviceTasks = tasks.filter(t => t.deviceId === device.id);
  
  // Calculate costs
  const repairCosts = deviceTasks.reduce((sum, task) => {
    const partsCost = (task.usedParts || []).reduce((pSum, up) => {
      const part = parts.find(p => p.id === up.partId);
      return pSum + (part ? part.cost * up.quantity : 0);
    }, 0);
    return sum + partsCost + (task.commission || 0);
  }, 0);
  
  const totalCost = device.importPrice + repairCosts;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-card rounded-xl border border-dark-border w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-dark-text">Lịch sử chi tiết: {device.model} - {device.imei}</h2>
          <button onClick={onClose} className="text-dark-muted hover:text-neon-pink"><XCircle /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cost Breakdown */}
          <div className="bg-dark-bg p-4 rounded-lg border border-dark-border">
            <h3 className="text-sm font-medium text-neon-cyan mb-3 flex items-center"><DollarSign className="w-4 h-4 mr-2"/> Chi phí</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Giá nhập:</span> <span>{device.importPrice.toLocaleString()}đ</span></div>
              <div className="flex justify-between"><span>Chi phí sửa chữa:</span> <span>{repairCosts.toLocaleString()}đ</span></div>
              <div className="flex justify-between font-bold text-neon-green"><span>Tổng giá:</span> <span>{totalCost.toLocaleString()}đ</span></div>
            </div>
          </div>

          {/* Repair History */}
          <div className="bg-dark-bg p-4 rounded-lg border border-dark-border">
            <h3 className="text-sm font-medium text-neon-cyan mb-3 flex items-center"><Wrench className="w-4 h-4 mr-2"/> Lịch sử sửa chữa ({deviceTasks.length})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto text-sm">
              {deviceTasks.map(task => (
                <div key={task.id} className="border-b border-dark-border pb-1">
                  <p className="font-medium">{task.type}</p>
                  <p className="text-xs text-dark-muted">{new Date(task.createdAt).toLocaleDateString()} - {task.status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Movement History (Simplified) */}
        <div className="mt-6 bg-dark-bg p-4 rounded-lg border border-dark-border">
          <h3 className="text-sm font-medium text-neon-cyan mb-3 flex items-center"><MapPin className="w-4 h-4 mr-2"/> Vòng đi của máy</h3>
          <div className="text-sm text-dark-text">
            <p>Nhập kho: {new Date(device.importDate).toLocaleDateString()} - Nguồn: {device.source}</p>
            {qcReports.filter(qc => qc.deviceId === device.id).map(qc => (
              <p key={qc.id}>QC: {new Date(qc.testedAt).toLocaleDateString()} - Kết quả: {qc.status}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
