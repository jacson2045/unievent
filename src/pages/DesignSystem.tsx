import React, { useState } from "react";
import { Bell, Check, ChevronRight, Download, Search, Star, Zap } from "lucide-react";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { StatCard } from "../components/ui/Card";
import { Toggle } from "../components/ui/Input";

const colors = {
  primary: ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
  violet: ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
};

const primaryHex = ["#EEF2FF","#E0E7FF","#C7D2FE","#A5B4FC","#818CF8","#6366F1","#4F46E5","#4338CA","#3730A3","#312E81"];
const violetHex = ["#F5F3FF","#EDE9FE","#DDD6FE","#C4B5FD","#A78BFA","#8B5CF6","#7C3AED","#6D28D9","#5B21B6","#4C1D95"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold font-display text-slate-900 pb-2 border-b border-slate-200">{title}</h2>
      {children}
    </div>
  );
}

export default function DesignSystem() {
  const [toggle, setToggle] = useState(true);

  return (
    <div className="max-w-5xl flex flex-col gap-10">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-violet-600 rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-slate-900">Design System</h1>
            <p className="text-sm text-slate-500">UniEvent Pay · v1.0.0</p>
          </div>
        </div>
        <p className="text-slate-500 max-w-xl">Sistema de diseño centralizado para la plataforma UniEvent Pay. Todos los componentes, tokens y patrones visuales para construir interfaces consistentes.</p>
      </div>

      {/* Colors */}
      <Section title="🎨 Paleta de colores">
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Primary (Indigo)</p>
          <div className="flex gap-1 flex-wrap">
            {primaryHex.map((hex, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-xl border border-black/10 shadow-sm" style={{ background: hex }} />
                <span className="text-[9px] font-mono text-slate-500">{colors.primary[i]}</span>
                <span className="text-[9px] font-mono text-slate-400">{hex}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Secondary (Violet)</p>
          <div className="flex gap-1 flex-wrap">
            {violetHex.map((hex, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-xl border border-black/10 shadow-sm" style={{ background: hex }} />
                <span className="text-[9px] font-mono text-slate-500">{colors.violet[i]}</span>
                <span className="text-[9px] font-mono text-slate-400">{hex}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { name: "Success", bg: "#DCFCE7", text: "#16A34A", label: "green" },
            { name: "Warning", bg: "#FEF3C7", text: "#D97706", label: "amber" },
            { name: "Danger", bg: "#FEE2E2", text: "#DC2626", label: "red" },
            { name: "Info", bg: "#E0F2FE", text: "#0284C7", label: "sky" },
          ].map(({ name, bg, text, label }) => (
            <div key={name} className="rounded-xl p-4" style={{ background: bg }}>
              <p className="font-bold text-sm" style={{ color: text }}>{name}</p>
              <p className="text-xs mt-1 font-mono" style={{ color: text }}>BG: {bg}</p>
              <p className="text-xs font-mono" style={{ color: text }}>Text: {text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section title="✍️ Tipografía">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4">
          {[
            { label: "Display · Plus Jakarta Sans 800", cls: "text-4xl font-black font-display", sample: "Gestiona tus eventos" },
            { label: "H1 · Plus Jakarta Sans 700", cls: "text-3xl font-bold font-display", sample: "Dashboard Estudiante" },
            { label: "H2 · Plus Jakarta Sans 700", cls: "text-2xl font-bold font-display", sample: "Explorar eventos" },
            { label: "H3 · Plus Jakarta Sans 600", cls: "text-xl font-semibold font-display", sample: "Mis inscripciones" },
            { label: "H4 · Plus Jakarta Sans 600", cls: "text-lg font-semibold font-display", sample: "Detalle del evento" },
            { label: "Body Large · Inter 400", cls: "text-base", sample: "Inscríbete a los mejores eventos universitarios y gestiona tus pagos en un solo lugar." },
            { label: "Body · Inter 400", cls: "text-sm", sample: "Selecciona el método de pago que prefieras para completar tu inscripción al evento." },
            { label: "Body Small · Inter 400", cls: "text-xs", sample: "Pago simulado para fines académicos — no se procesa dinero real." },
            { label: "Caption · Inter 500", cls: "text-xs font-medium text-slate-400", sample: "Hace 2 horas · TXN-2026-08142" },
            { label: "Mono · JetBrains Mono 400", cls: "text-sm font-mono", sample: "ANR-20211234-CIAI-01 · S/ 45.00" },
          ].map(({ label, cls, sample }) => (
            <div key={label} className="flex flex-col gap-0.5 py-2 border-b border-slate-50 last:border-0">
              <p className="text-[10px] font-mono text-slate-400">{label}</p>
              <p className={cls}>{sample}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Spacing */}
      <Section title="📐 Espaciado (escala 8px)">
        <div className="flex gap-4 items-end flex-wrap bg-white rounded-2xl border border-slate-100 p-6">
          {[4, 8, 12, 16, 24, 32, 48, 64].map(s => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div className="bg-primary-200 rounded" style={{ width: s, height: s }} />
              <span className="text-[10px] font-mono text-slate-500">{s}px</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Buttons */}
      <Section title="🔘 Botones">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">Variantes</p>
            <div className="flex gap-3 flex-wrap">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="success">Success</Button>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">Tamaños</p>
            <div className="flex gap-3 flex-wrap items-center">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">Estados</p>
            <div className="flex gap-3 flex-wrap">
              <Button loading>Cargando</Button>
              <Button disabled>Deshabilitado</Button>
              <Button icon={<Download size={16} />}>Con ícono</Button>
              <Button iconRight={<ChevronRight size={16} />}>Continuar</Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Badges */}
      <Section title="🏷️ Badges / Estados">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-wrap gap-3">
          {(["active", "pending", "confirmed", "approved", "rejected", "cancelled", "info", "free", "attended", "degraded", "online", "offline", "student", "organizer", "admin", "draft", "inactive"] as const).map(v => (
            <Badge key={v} variant={v} dot />
          ))}
        </div>
      </Section>

      {/* Input */}
      <Section title="📝 Inputs">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Default</label>
            <input placeholder="Escribe aquí..." className="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Con error</label>
            <input placeholder="Correo inválido" className="h-10 px-3 rounded-xl border border-red-400 text-sm bg-white outline-none focus:ring-2 focus:ring-red-100" />
            <p className="text-xs text-red-600">El correo electrónico es requerido</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Deshabilitado</label>
            <input disabled placeholder="No editable" className="h-10 px-3 rounded-xl border border-slate-100 text-sm bg-slate-50 text-slate-400 cursor-not-allowed outline-none" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Search</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input placeholder="Buscar eventos..." className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Select</label>
            <select className="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-primary-500">
              <option>Tecnología</option>
              <option>Taller</option>
              <option>Charla</option>
            </select>
          </div>
          <div className="flex flex-col gap-4 justify-center">
            <Toggle checked={toggle} onChange={setToggle} label="Toggle activado" />
            <Toggle checked={false} onChange={() => {}} label="Toggle desactivado" />
          </div>
        </div>
      </Section>

      {/* Stat cards */}
      <Section title="📊 Stat Cards">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Eventos activos" value="28" sub="Este semestre" icon={<Zap size={20} />} color="primary" trend={{ value: "+5 este mes", up: true }} />
          <StatCard label="Inscripciones" value="1,340" sub="+89 hoy" icon={<Bell size={20} />} color="violet" trend={{ value: "+12%", up: true }} />
          <StatCard label="Ingresos" value="S/ 48k" sub="Ciclo 2026-I" icon={<Star size={20} />} color="green" trend={{ value: "+S/8k", up: true }} />
          <StatCard label="Tasa de error" value="0.21%" sub="Últimas 24h" icon={<Check size={20} />} color="red" trend={{ value: "-0.1%", up: true }} />
        </div>
      </Section>

      {/* Shadows & radius */}
      <Section title="🌐 Elevación y bordes">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 flex gap-6 flex-wrap items-center">
          {[
            { label: "Low", cls: "shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]" },
            { label: "Mid", cls: "shadow-[0_4px_12px_-2px_rgb(0_0_0/0.12)]" },
            { label: "High", cls: "shadow-[0_20px_40px_-8px_rgb(0_0_0/0.18)]" },
          ].map(({ label, cls }) => (
            <div key={label} className={`w-24 h-24 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-sm text-slate-500 font-medium ${cls}`}>
              {label}
            </div>
          ))}
          {[
            { label: "8px (sm)", r: "rounded-lg" },
            { label: "12px (md)", r: "rounded-xl" },
            { label: "20px (lg)", r: "rounded-[20px]" },
          ].map(({ label, r }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className={`w-20 h-20 bg-primary-100 border-2 border-primary-300 flex items-center justify-center ${r}`}>
                <span className="text-[10px] text-primary-700 font-mono text-center">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
