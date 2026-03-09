import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAppContext } from "../store/AppContext";
import { MOCK_USERS } from "../store/AppContext";
import {
  LayoutDashboard,
  Smartphone,
  ClipboardCheck,
  Wrench,
  Settings,
  Package,
  ShieldCheck,
  UserCircle,
  Users,
  Store,
  Menu,
  X,
  DollarSign,
  UserPlus,
  HelpCircle,
  LogOut,
  Table,
  Box,
  Truck,
  FileText,
  Activity,
  BookOpen,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import GlobalSearch from "./GlobalSearch";
import NotificationBell from "./NotificationBell";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NAV_GROUPS = [
  {
    title: "Tổng Quan",
    items: [
      { path: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "TRUONG_KT"] },
    ]
  },
  {
    title: "Quản Lý Kho",
    items: [
      { path: "/hang-hoa", label: "Danh Mục Hàng Hóa", icon: Box, roles: ["ADMIN"] },
      { path: "/phieu-nhap-hang", label: "Phiếu Nhập Hàng", icon: FileText, roles: ["ADMIN", "KHO_MAY"] },
      { path: "/kho-may", label: "Kho Máy", icon: Smartphone, roles: ["ADMIN", "KHO_MAY"] },
      { path: "/kho-linh-kien", label: "Kho Linh Kiện", icon: Package, roles: ["ADMIN", "KHO_LINH_KIEN"] },
    ]
  },
  {
    title: "Quy Trình Kỹ Thuật",
    items: [
      { path: "/test-dau-vao", label: "Test Đầu Vào", icon: Activity, roles: ["ADMIN", "TESTER", "TRUONG_KT"] },
      { path: "/quyet-dinh", label: "Duyệt Quyết Định", icon: ClipboardCheck, roles: ["ADMIN", "TRUONG_KT"] },
      { path: "/dieu-phoi", label: "Điều Phối Task", icon: Settings, roles: ["ADMIN", "TRUONG_KT"] },
      { path: "/ky-thuat", label: "Kỹ Thuật", icon: Wrench, roles: ["ADMIN", "KY_THUAT"] },
      { path: "/qc", label: "QC & Thẩm Định", icon: ShieldCheck, roles: ["ADMIN", "QC"] },
    ]
  },
  {
    title: "Kinh Doanh & Báo Cáo",
    items: [
      { path: "/phan-phoi", label: "Bán Hàng", icon: Store, roles: ["ADMIN", "SALE"] },
      { path: "/bao-cao-ton-kho", label: "Báo Cáo Tồn Kho", icon: Table, roles: ["ADMIN", "KHO_MAY", "TRUONG_KT"] },
      { path: "/nguon-hang", label: "Báo Cáo Theo Nguồn", icon: Truck, roles: ["ADMIN", "KHO_MAY"] },
      { path: "/bao-cao-thu-nhap", label: "Báo Cáo Thu Nhập", icon: DollarSign, roles: ["ADMIN", "KY_THUAT"] },
    ]
  },
  {
    title: "Hệ Thống",
    items: [
      { path: "/nhan-vien", label: "Nhân Sự", icon: Users, roles: ["ADMIN"] },
      { path: "/huong-dan", label: "Hướng Dẫn", icon: BookOpen, roles: ["ADMIN", "KHO_MAY", "TESTER", "TRUONG_KT", "KY_THUAT", "KHO_LINH_KIEN", "QC", "SALE"] },
    ]
  }
];

export default function Layout() {
  const { state, dispatch } = useAppContext();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  // Close sidebar on mobile when route changes
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const user = state.users.find((u) => u.id === e.target.value);
    if (user) {
      dispatch({ type: "SET_USER", payload: user });
      localStorage.setItem("phonehouse_user", JSON.stringify(user));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("phonehouse_user");
    window.location.href = "/"; // Simple reload to clear state
  };

  return (
    <div className="flex h-screen bg-dark-bg font-sans text-dark-text overflow-hidden">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-dark-card border-r border-dark-border flex flex-col transform transition-transform duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-dark-border flex justify-between items-center">
          <Link to="/">
            <h1 className="text-2xl font-bold text-neon-cyan tracking-tight neon-text">
              Phone House
            </h1>
            <p className="text-xs text-dark-muted mt-1">
              Hệ thống quản lý kỹ thuật
            </p>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-dark-muted hover:bg-dark-border hover:text-dark-text rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {NAV_GROUPS.map((group, idx) => {
            const visibleItems = group.items.filter(
              (item) => state.currentUser && item.roles.includes(state.currentUser.role)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                <h3 className="px-3 text-[10px] font-semibold text-dark-muted uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-neon-cyan/10 text-neon-cyan neon-border"
                          : "text-dark-text hover:bg-dark-border hover:text-neon-cyan",
                      )}
                    >
                      <Icon
                        className={cn(
                          "mr-3 h-4 w-4",
                          isActive ? "text-neon-cyan" : "text-dark-muted",
                        )}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-dark-border bg-dark-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <UserCircle className="h-8 w-8 text-dark-muted mr-2" />
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-dark-text truncate">
                  {state.currentUser?.name}
                </p>
                <p className="text-[10px] text-neon-pink uppercase tracking-wider">{state.currentUser?.role}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-dark-muted hover:text-neon-pink transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Role switcher for ADMIN only */}
          {state.currentUser?.role === "ADMIN" && (
            <div className="mt-4 pt-4 border-t border-dark-border/50">
              <label className="block text-[10px] text-dark-muted uppercase tracking-widest mb-2">Chuyển quyền nhanh</label>
              <select
                className="w-full text-xs bg-dark-bg border-dark-border text-dark-text rounded-md py-1.5 focus:border-neon-cyan focus:ring-neon-cyan dark-input"
                value={state.currentUser?.id || ""}
                onChange={handleRoleChange}
              >
                {state.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ease-in-out",
        isSidebarOpen ? "lg:ml-64" : "lg:ml-0"
      )}>
        {/* Header (Mobile & Desktop) */}
        <header className="bg-dark-card border-b border-dark-border shrink-0 sticky top-0 z-30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 lg:px-8 gap-4">
            <div className="flex items-center justify-between sm:w-auto">
              <div className="flex items-center">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 mr-2 text-dark-muted hover:bg-dark-border rounded-md">
                  <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-neon-cyan tracking-tight neon-text">
                  Phone House
                </h1>
              </div>
            </div>
            
            <div className="flex-1 w-full sm:max-w-md lg:max-w-2xl flex items-center gap-4">
              <GlobalSearch />
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-dark-bg pb-20">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

        {/* Bottom Navigation (Fixed) */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-card border-t border-dark-border lg:hidden flex justify-around p-2">
          {[
            { path: "/", label: "Dashboard", icon: LayoutDashboard },
            { path: "/phieu-nhap-hang", label: "Nhập Hàng", icon: ClipboardCheck },
            { path: "/dieu-phoi", label: "Điều Phối", icon: Settings },
            { path: "/bao-cao-ton-kho", label: "Tồn Kho", icon: Table },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center p-2 text-[10px] font-medium rounded-lg transition-colors",
                  isActive ? "text-neon-cyan" : "text-dark-muted hover:text-dark-text"
                )}
              >
                <Icon className="h-5 w-5 mb-1" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
