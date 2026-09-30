import React, { useState } from "react";
import { Search, UserPlus, Eye, Edit2, UserX, ShieldCheck } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { users } from "../../data/mockData";

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.includes(q) || u.code.includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchQ && matchRole;
  });

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Gestión de usuarios</h2>
          <p className="text-sm text-slate-500">{users.length} usuarios registrados en el sistema</p>
        </div>
        <Button size="sm" icon={<UserPlus size={15} />}>Agregar usuario</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar usuario..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
          />
        </div>
        <div className="flex gap-1">
          {["all", "student", "organizer", "admin"].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 h-9 rounded-xl text-sm font-medium transition-colors ${roleFilter === r ? "bg-primary-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              {r === "all" ? "Todos" : r === "student" ? "Estudiantes" : r === "organizer" ? "Organizadores" : "Admins"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Usuario", "Código", "Correo", "Rol", "Estado", "Registro", "Acciones"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${u.role === "admin" ? "bg-slate-800" : u.role === "organizer" ? "bg-violet-500" : "bg-gradient-to-br from-primary-400 to-primary-600"}`}>
                        {u.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </div>
                      <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">{u.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm font-mono text-slate-500">{u.code}</td>
                  <td className="px-4 py-4 text-sm text-slate-500">{u.email}</td>
                  <td className="px-4 py-4"><Badge variant={u.role as any} /></td>
                  <td className="px-4 py-4">
                    <Badge variant={u.status as any}>
                      {u.status === "active" ? "Activo" : u.status === "inactive" ? "Inactivo" : "Pendiente"}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500">{u.joinedAt}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1">
                      {[
                        { icon: <Eye size={14} />, title: "Ver" },
                        { icon: <Edit2 size={14} />, title: "Editar" },
                        { icon: <ShieldCheck size={14} />, title: "Cambiar rol" },
                        { icon: <UserX size={14} />, title: "Desactivar" },
                      ].map(({ icon, title }) => (
                        <button key={title} title={title} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                          {icon}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-400 text-sm">No se encontraron usuarios con ese filtro.</p>
          </div>
        )}
        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">Mostrando {filtered.length} de {users.length} usuarios</p>
          <div className="flex gap-1">
            {[1, 2, 3].map(p => (
              <button key={p} className={`w-8 h-8 rounded-lg text-sm font-medium ${p === 1 ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
