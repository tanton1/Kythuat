export type Role =
  | "KHO_MAY"
  | "TESTER"
  | "TRUONG_KT"
  | "KY_THUAT"
  | "KHO_LINH_KIEN"
  | "QC"
  | "ADMIN"
  | "SALE";

export type DeviceLocation = 'KHO_TONG' | 'XSTORE' | 'PH_DN' | 'PH_HUE' | 'PH_QNG' | 'DA_BAN';

export type DeviceStatus =
  | "MOI_NHAP"
  | "CHO_TEST"
  | "DA_TEST"
  | "CHO_BAN"
  | "SAN_SANG"
  | "CHO_PHAN_TASK"
  | "CHO_QUYET_DINH"
  | "MAY_XAC"
  | "TRADE_IN"
  | "DANG_XU_LY"
  | "CHO_LINH_KIEN"
  | "CHO_QC"
  | "HOAN_TAT"
  | "BAO_HANH"
  | "CHO_TRA_NCC"
  | "DA_TRA_NCC"
  | "DA_BAN";

export type Permission = 
  | 'VIEW_DASHBOARD'
  | 'MANAGE_USERS'
  | 'MANAGE_DEVICES'
  | 'MANAGE_PARTS'
  | 'MANAGE_TASKS'
  | 'MANAGE_QC'
  | 'MANAGE_SUPPLIERS'
  | 'MANAGE_PRODUCTS'
  | 'MANAGE_IMPORT'
  | 'MANAGE_DISTRIBUTION'
  | 'VIEW_REPORTS';

export interface User {
  id: string;
  name: string;
  role: Role;
  email?: string;
  password?: string;
  phone?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  permissions?: Permission[];
}

export interface Device {
  id: string;
  imei: string;
  model: string;
  color: string;
  capacity: string;
  source: string;
  importPrice: number;
  importDate: string;
  receiverId: string;
  status: DeviceStatus;
  notes: string;
  images: string[];
  appearance?: 'LN' | '99%' | '98%';
  testResults?: Record<string, "OK" | "FAIL" | "UNTESTED">;
  receptionType?: 'IMPORT' | 'SHOP_TRANSFER' | 'WARRANTY' | 'SERVICE' | 'TRADE_IN';
  customerPhone?: string;
  receptionDate?: string;
  location?: DeviceLocation;
  sellPrice?: number;
  customerInfo?: string;
  sellDate?: string;
}

export type TaskStatus =
  | "MOI_TAO"
  | "DA_GIAO"
  | "DA_NHAN"
  | "DANG_XU_LY"
  | "CHO_LINH_KIEN"
  | "CHO_DUYET_PHAT_SINH"
  | "CHO_HO_TRO"
  | "HOAN_THANH_CHO_QC"
  | "DONG_TASK"
  | "HUY_TASK";

export interface Task {
  id: string;
  deviceId: string;
  type: string;
  description: string;
  priority: "LOW" | "NORMAL" | "HIGH";
  assigneeId: string;
  assignerId: string;
  deadline: string;
  status: TaskStatus;
  notes: string;
  createdAt: string;
  usedParts?: { partId: string; quantity: number }[];
  commission?: number; // Hoa hồng cho KTV
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'DEVICE' | 'PART' | 'SERVICE';
  model: string;
  costPrice: number;
  sellPrice: number;
  notes?: string;
  commission?: number; // Hoa hồng định mức cho dịch vụ này
}

export interface Part {
  id: string;
  name: string;
  model: string;
  cost: number;
  stock: number;
  supplierId?: string;
}

export interface TechnicianStock {
  id: string;
  technicianId: string;
  partId: string;
  quantity: number;
}

export interface PartRequest {
  id: string;
  taskId?: string;
  partId: string;
  quantity: number;
  status: "CHO_XUAT" | "DA_XUAT" | "TU_CHOI";
  requestedAt: string;
  exportedAt?: string;
  exportedBy?: string;
  requestType?: 'FOR_TASK' | 'FOR_STOCK';
  technicianId?: string;
}

export interface Incident {
  id: string;
  deviceId: string;
  taskId: string;
  description: string;
  reportedBy: string;
  reportedAt: string;
  status: "CHO_DUYET" | "DA_DUYET" | "TU_CHOI";
  resolution?: string;
}

export interface QCReport {
  id: string;
  deviceId: string;
  taskId: string;
  testerId: string;
  testedAt: string;
  status: "PASS" | "FAIL";
  notes: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'SYSTEM';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ImportReceipt {
  id: string;
  supplierName: string;
  importDate: string;
  totalAmount: number;
  notes: string;
  items: {
    imei: string;
    model: string;
    color: string;
    capacity: string;
    importPrice: number;
  }[];
  receiverId: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  devices: Device[];
  tasks: Task[];
  parts: Part[];
  partRequests: PartRequest[];
  incidents: Incident[];
  qcReports: QCReport[];
  technicianStocks: TechnicianStock[];
  suppliers: Supplier[];
  products: Product[];
  notifications: AppNotification[];
  importReceipts: ImportReceipt[];
}
