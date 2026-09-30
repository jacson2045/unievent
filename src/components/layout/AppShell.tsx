import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

type Role = "student" | "organizer" | "admin";

const DEFAULT_ROLE_NAMES: Record<Role, string> = {
  student: "Ana Ramírez Torres",
  organizer: "Carlos Mendoza Quispe",
  admin: "Roberto Lima Paredes",
};

const DEFAULT_ROLE_LABELS: Record<Role, string> = {
  student: "Estudiante",
  organizer: "Organizador",
  admin: "Administrador",
};

interface AppShellProps {
  role: Role;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  title: string;
  children: React.ReactNode;
  navRight?: React.ReactNode;
  userName?: string;
  userRole?: string;
}

export default function AppShell({
  role,
  currentPage,
  onNavigate,
  onLogout,
  title,
  children,
  navRight,
  userName,
  userRole,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  const displayName = userName ?? DEFAULT_ROLE_NAMES[role];
  const displayRoleLabel = userRole ?? DEFAULT_ROLE_LABELS[role];

  return (
    <div className="flex h-full app-bg">
      <Sidebar
        role={role}
        currentPage={currentPage}
        onNavigate={onNavigate}
        onLogout={onLogout}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          title={title}
          userName={displayName}
          userRole={displayRoleLabel}
          notificationCount={2}
          onNotifications={() => onNavigate("notifications")}
          onProfile={() => onNavigate("profile")}
          rightContent={navRight}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
