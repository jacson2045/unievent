import React from "react";
import {
  LayoutDashboard, Calendar, BookOpen, CreditCard, QrCode, Bell, User,
  LogOut, ChevronRight, Users, Settings, Activity, Plus, BarChart3,
  Shield, Zap, Menu, X
} from "lucide-react";

type Role = "student" | "organizer" | "admin";

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const studentNav: NavItem[] = [
  { key: "student-dashboard", label: "Inicio", icon: <LayoutDashboard size={18} /> },
  { key: "explore-events", label: "Explorar eventos", icon: <Calendar size={18} /> },
  { key: "my-enrollments", label: "Mis inscripciones", icon: <BookOpen size={18} /> },
  { key: "my-payments", label: "Mis pagos", icon: <CreditCard size={18} /> },
  { key: "my-attendance", label: "Mis asistencias", icon: <QrCode size={18} /> },
  { key: "notifications", label: "Notificaciones", icon: <Bell size={18} />, badge: 2 },
  { key: "profile", label: "Perfil", icon: <User size={18} /> },
];

const organizerNav: NavItem[] = [
  { key: "organizer-dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { key: "my-events", label: "Mis eventos", icon: <Calendar size={18} /> },
  { key: "create-event", label: "Crear evento", icon: <Plus size={18} /> },
  { key: "participants", label: "Participantes", icon: <Users size={18} /> },
  { key: "org-payments", label: "Pagos", icon: <CreditCard size={18} /> },
  { key: "org-stats", label: "Estadísticas", icon: <BarChart3 size={18} /> },
  { key: "notifications", label: "Notificaciones", icon: <Bell size={18} />, badge: 1 },
  { key: "profile", label: "Perfil", icon: <User size={18} /> },
];

const adminNav: NavItem[] = [
  { key: "admin-dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { key: "user-management", label: "Gestión de usuarios", icon: <Users size={18} /> },
  { key: "system-monitoring", label: "Monitoreo del sistema", icon: <Activity size={18} /> },
  { key: "notifications", label: "Notificaciones", icon: <Bell size={18} /> },
  { key: "profile", label: "Perfil", icon: <User size={18} /> },
];

const navByRole: Record<Role, NavItem[]> = {
  student: studentNav,
  organizer: organizerNav,
  admin: adminNav,
};

const roleLabel: Record<Role, string> = {
  student: "Estudiante",
  organizer: "Organizador",
  admin: "Administrador",
};

interface SidebarProps {
  role: Role;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ role, currentPage, onNavigate, onLogout, collapsed = false, onToggle }: SidebarProps) {
  const nav = navByRole[role];

  return (
    <aside
      className={[
        "flex flex-col h-full bg-white border-r border-slate-100 transition-all duration-300 flex-shrink-0",
        collapsed ? "w-16" : "w-60",
      ].join(" ")}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-slate-100 flex-shrink-0 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-slate-900 font-display leading-tight">UniEvent Pay</p>
            <p className="text-[10px] text-slate-400 leading-tight">{roleLabel[role]}</p>
          </div>
        )}
        {!collapsed && onToggle && (
          <button onClick={onToggle} className="ml-auto text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50">
            <Menu size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="flex flex-col gap-0.5">
          {nav.map((item) => {
            const active = currentPage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                title={collapsed ? item.label : undefined}
                className={[
                  "flex items-center gap-3 rounded-xl h-10 px-3 text-sm font-medium transition-all duration-150 w-full text-left relative",
                  active
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  collapsed ? "justify-center px-0" : "",
                ].join(" ")}
              >
                <span className={`flex-shrink-0 ${active ? "text-primary-600" : "text-slate-400"}`}>{item.icon}</span>
                {!collapsed && <span className="flex-1">{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                {collapsed && item.badge && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
                {!collapsed && active && <ChevronRight size={14} className="text-primary-400" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-slate-100 flex-shrink-0">
        <button
          onClick={onLogout}
          className={`flex items-center gap-3 rounded-xl h-10 px-3 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all w-full ${collapsed ? "justify-center px-0" : ""}`}
        >
          <LogOut size={18} />
          {!collapsed && "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
}
