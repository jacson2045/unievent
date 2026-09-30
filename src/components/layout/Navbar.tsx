import React from "react";
import { Bell, Search, ChevronDown } from "lucide-react";

interface NavbarProps {
  title: string;
  userName?: string;
  userRole?: string;
  notificationCount?: number;
  onNotifications?: () => void;
  onProfile?: () => void;
  rightContent?: React.ReactNode;
}

export default function Navbar({ title, userName = "Ana Ramírez", userRole = "Estudiante", notificationCount = 2, onNotifications, onProfile, rightContent }: NavbarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 gap-4 flex-shrink-0">
      <h1 className="text-lg font-semibold text-slate-900 font-display flex-1">{title}</h1>

      {rightContent}

      <div className="relative hidden md:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          placeholder="Buscar eventos..."
          className="h-9 w-56 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
        />
      </div>

      <button
        onClick={onNotifications}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
      >
        <Bell size={18} />
        {notificationCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        )}
      </button>

      <button
        onClick={onProfile}
        className="flex items-center gap-2 h-9 pl-2 pr-3 rounded-xl hover:bg-slate-50 transition-colors"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
          {userName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-xs font-semibold text-slate-900 leading-tight">{userName}</p>
          <p className="text-[10px] text-slate-400 leading-tight">{userRole}</p>
        </div>
        <ChevronDown size={14} className="text-slate-400" />
      </button>
    </header>
  );
}
