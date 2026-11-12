import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, UserCheck, UserX, Users } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { listUsers, setUserActive, setUserRole, type BackendRole } from "../../api/adminApi";
import type { Profile } from "../../api/authApi";
import { getUser } from "../../utils/auth";
import { formatDateTime } from "../../utils/status";

const ROLES: { id: BackendRole; label: string; variant: "student" | "organizer" | "admin" }[] = [
  { id: "ESTUDIANTE", label: "Estudiante", variant: "student" },
  { id: "ORGANIZADOR", label: "Organizador", variant: "organizer" },
  { id: "ADMIN", label: "Administrador", variant: "admin" },
];
const roleInfo = (rol: string) => ROLES.find((r) => r.id === rol) ?? ROLES[0];

export default function UserManagement() {
  const me = getUser()?.correo;
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"all" | BackendRole>("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await listUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (!q || u.nombreCompleto.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q)) &&
        (role === "all" || u.rol === role) &&
        (status === "all" || (status === "active" ? u.activo : !u.activo)),
    );
  }, [users, search, role, status]);

  const counts = useMemo(
    () => ({
      total: users.length,
      ESTUDIANTE: users.filter((u) => u.rol === "ESTUDIANTE").length,
      ORGANIZADOR: users.filter((u) => u.rol === "ORGANIZADOR").length,
      ADMIN: users.filter((u) => u.rol === "ADMIN").length,
      inactive: users.filter((u) => !u.activo).length,
    }),
    [users],
  );

  const replace = (updated: Profile) => setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));

  const toggleActive = async (u: Profile) => {
    const next = !u.activo;
    if (!next && !window.confirm(`¿Desactivar la cuenta de ${u.correo}? No podrá iniciar sesión.`)) return;
    setBusyId(u.id);
    setError("");
    try {
      replace(await setUserActive(u.id, next));
      setNotice(`${u.correo} fue ${next ? "activado" : "desactivado"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el estado.");
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = async (u: Profile, rol: BackendRole) => {
    if (rol === u.rol) return;
    if (!window.confirm(`¿Cambiar el rol de ${u.correo} a ${roleInfo(rol).label}? Aplicará en su próximo inicio de sesión.`)) return;
    setBusyId(u.id);
    setError("");
    try {
      replace(await setUserRole(u.id, rol));
      setNotice(`${u.correo} ahora es ${roleInfo(rol).label}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el rol.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Gestión de usuarios</h2>
          <p className="text-sm text-slate-500">{loading ? "Cargando..." : `${counts.total} usuarios registrados`}</p>
        </div>
        <Button onClick={() => void load()} variant="ghost" size="sm" icon={<RefreshCw size={14} />} disabled={loading}>
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Estudiantes", value: counts.ESTUDIANTE, color: "text-primary-600 bg-primary-50" },
          { label: "Organizadores", value: counts.ORGANIZADOR, color: "text-violet-600 bg-violet-50" },
          { label: "Administradores", value: counts.ADMIN, color: "text-slate-700 bg-slate-100" },
          { label: "Desactivados", value: counts.inactive, color: "text-red-600 bg-red-50" },
        ].map((c) => (
          <div key={c.label} className={`rounded-2xl p-4 flex flex-col items-center ${c.color}`}>
            <span className="text-2xl font-bold font-display">{loading ? "…" : c.value}</span>
            <span className="text-sm font-medium">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-primary-500"
          />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-700 outline-none">
          <option value="all">Todos los roles</option>
          {ROLES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-700 outline-none">
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Desactivados</option>
        </select>
      </div>

      {notice && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 flex justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="h-64 bg-white rounded-2xl border border-slate-100 animate-pulse" />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
          <Users size={32} className="text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">Ningún usuario coincide con los filtros.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Usuario", "Rol", "Estado", "Registro", "Acciones"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isMe = u.correo === me;
                  const r = roleInfo(u.rol);
                  return (
                    <tr key={u.id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50 ${u.activo ? "" : "opacity-60"}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {u.nombreCompleto.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {u.nombreCompleto} {isMe && <span className="text-xs text-slate-400">(tú)</span>}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{u.correo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isMe ? (
                          <Badge variant={r.variant}>{r.label}</Badge>
                        ) : (
                          <select
                            value={u.rol}
                            disabled={busyId === u.id}
                            onChange={(e) => void changeRole(u, e.target.value as BackendRole)}
                            aria-label={`Rol de ${u.correo}`}
                            className="h-8 px-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 outline-none"
                          >
                            {ROLES.map((x) => (
                              <option key={x.id} value={x.id}>
                                {x.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.activo ? <Badge variant="active" dot>Activo</Badge> : <Badge variant="inactive" dot>Desactivado</Badge>}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDateTime(u.creadoEn)}</td>
                      <td className="px-4 py-3">
                        {!isMe && (
                          <Button
                            size="sm"
                            variant={u.activo ? "ghost" : "secondary"}
                            loading={busyId === u.id}
                            onClick={() => void toggleActive(u)}
                            icon={u.activo ? <UserX size={14} /> : <UserCheck size={14} />}
                          >
                            {u.activo ? "Desactivar" : "Activar"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
            Mostrando {filtered.length} de {users.length}
          </div>
        </div>
      )}
    </div>
  );
}
