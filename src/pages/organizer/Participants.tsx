import React, { useState } from "react";
import { Search, Download, Eye, Filter } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { users } from "../../data/mockData";

const participants = users.filter(u => u.role === "student").map((u, i) => ({
  ...u,
  enrollmentStatus: i % 3 === 0 ? "confirmed" : i % 3 === 1 ? "confirmed" : "confirmed",
  paymentStatus: i % 4 === 0 ? "pending" : "approved",
  attendance: i % 3 === 0 ? "attended" : "pending",
  enrolledAt: "2026-08-10",
}));

export default function Participants() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = participants.filter(p => {
    const q = search.toLowerCase();
    const match = !q || p.name.toLowerCase().includes(q) || p.email.includes(q) || p.code.includes(q);
    const statusMatch = filterStatus === "all" || p.paymentStatus === filterStatus;
    return match && statusMatch;
  });

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Participantes</h2>
          <p className="text-sm text-slate-500">Gestiona los inscritos a tus eventos</p>
        </div>
        <Button variant="secondary" size="sm" icon={<Download size={15} />}>Exportar</Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { l: "Total inscritos", v: participants.length, color: "text-primary-600 bg-primary-50" },
          { l: "Pagos aprobados", v: participants.filter(p => p.paymentStatus === "approved").length, color: "text-green-600 bg-green-50" },
          { l: "Pagos pendientes", v: participants.filter(p => p.paymentStatus === "pending").length, color: "text-amber-600 bg-amber-50" },
          { l: "Asistentes", v: participants.filter(p => p.attendance === "attended").length, color: "text-violet-600 bg-violet-50" },
        ].map(({ l, v, color }) => (
          <div key={l} className={`rounded-2xl p-4 ${color}`}>
            <p className="text-2xl font-bold font-display">{v}</p>
            <p className="text-xs font-medium">{l}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar participante..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
          />
        </div>
        <div className="flex gap-1">
          {["all", "approved", "pending"].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 h-9 rounded-xl text-sm font-medium transition-colors ${filterStatus === s ? "bg-primary-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              {s === "all" ? "Todos" : s === "approved" ? "Pagados" : "Pendientes"}
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
                {["Participante", "Código", "Correo", "Inscripción", "Pago", "Asistencia", "Acciones"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {p.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm font-mono text-slate-600">{p.code}</td>
                  <td className="px-4 py-4 text-sm text-slate-500">{p.email}</td>
                  <td className="px-4 py-4"><Badge variant={p.enrollmentStatus as any} /></td>
                  <td className="px-4 py-4"><Badge variant={p.paymentStatus as any} /></td>
                  <td className="px-4 py-4"><Badge variant={p.attendance === "attended" ? "attended" : "pending"}>{p.attendance === "attended" ? "Asistió" : "Pendiente"}</Badge></td>
                  <td className="px-4 py-4">
                    <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors">
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-400 text-sm">No se encontraron participantes con ese filtro.</p>
          </div>
        )}
      </div>
    </div>
  );
}
