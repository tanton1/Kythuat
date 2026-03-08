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
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import GlobalSearch from "./GlobalSearch";
import NotificationBell from "./NotificationBell";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NAV_ITEMS = [
  {
    path: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "TRUONG_KT"],
  },
  {
    path: "/tiep-nhan",
    label: "Nhập Hàng",
    icon: UserPlus,
    roles: ["ADMIN", "KHO_MAY", "TESTER"],
  },
  {
    path: "/kho-may",
    label: "Kho Máy",
    icon: Smartphone,
    roles: ["ADMIN", "KHO_MAY"],
  },
  {
    path: "/test-dau-vao",
    label: "Test Đầu Vào",
    icon: ClipboardCheck,
    roles: ["ADMIN", "TESTER", "TRUONG_KT"],
  },
  {
    path: "/quyet-dinh",
    label: "Duyệt Quyết Định",
    icon: HelpCircle,
    roles: ["ADMIN", "TRUONG_KT"],
  },
  {
    path: "/dieu-phoi",
    label: "Điều Phối Task",
    icon: Settings,
    roles: ["ADMIN", "TRUONG_KT"],
  },
  {
    path: "/ky-thuat",
    label: "Kỹ Thuật",
    icon: Wrench,
    roles: ["ADMIN", "KY_THUAT"],
  },
  {
    path: "/kho-linh-kien",
    label: "Kho Linh Kiện",
    icon: Package,
    roles: ["ADMIN", "KHO_LINH_KIEN"],
  },
  { path: "/qc", label: "QC", icon: ShieldCheck, roles: ["ADMIN", "QC"] },
  { path: "/phan-phoi", label: "Phân Phối & Bán Hàng", icon: Store, roles: ["ADMIN", "SALE"] },
  { path: "/hang-hoa", label: "Hàng Hóa", icon: Package, roles: ["ADMIN"] },
  { path: "/nguon-hang", label: "Nguồn Hàng", icon: Package, roles: ["ADMIN", "KHO_MAY"] },
  { path: "/bao-cao-thu-nhap", label: "Báo Cáo Thu Nhập", icon: DollarSign, roles: ["ADMIN", "KY_THUAT"] },
  { path: "/nhan-vien", label: "Nhân Viên", icon: Users, roles: ["ADMIN"] },
  { path: "/huong-dan", label: "Hướng Dẫn", icon: HelpCircle, roles: ["ADMIN", "KHO_MAY", "TESTER", "TRUONG_KT", "KY_THUAT", "KHO_LINH_KIEN", "QC", "SALE"] },
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

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => state.currentUser && item.roles.includes(state.currentUser.role),
  );

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
          <div>
            <h1 className="text-2xl font-bold text-neon-cyan tracking-tight neon-text">
              Phone House
            </h1>
            <p className="text-xs text-dark-muted mt-1">
              Hệ thống quản lý kỹ thuật
            </p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-dark-muted hover:bg-dark-border hover:text-dark-text rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-neon-cyan/10 text-neon-cyan neon-border"
                    : "text-dark-text hover:bg-dark-border",
                )}
              >
                <Icon
                  className={cn(
                    "mr-3 h-5 w-5",
                    isActive ? "text-neon-cyan" : "text-dark-muted",
                  )}
                />
                {item.label}
              </Link>
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
        <main className="flex-1 overflow-y-auto bg-dark-bg">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
