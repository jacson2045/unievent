import React, { useState } from "react";
import { Calendar, MapPin, Users, Search, SlidersHorizontal, Clock, Building2 } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { events } from "../../data/mockData";

interface Props { onNavigate: (p: string) => void }

function EventCard({ event, onClick }: { event: typeof events[0]; onClick: () => void }) {
  const available = event.capacity - event.enrolled;
  const pct = Math.round((event.enrolled / event.capacity) * 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] overflow-hidden group hover:shadow-[0_4px_12px_-2px_rgb(0_0_0/0.1)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer" onClick={onClick}>
      <div className="relative h-44 bg-slate-200 overflow-hidden">
        <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="active" dot>{event.modality}</Badge>
        </div>
        <div className="absolute top-3 right-3">
          {event.price > 0
            ? <span className="bg-white/95 text-primary-700 font-bold text-sm px-3 py-1 rounded-full shadow-sm">S/ {event.price.toFixed(2)}</span>
            : <Badge variant="free">Gratuito</Badge>}
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs text-violet-600 font-semibold bg-violet-50 px-2 py-0.5 rounded-lg">{event.category}</span>
        </div>
        <h3 className="font-semibold text-slate-900 font-display leading-snug mb-1 line-clamp-2 group-hover:text-primary-700 transition-colors">{event.title}</h3>
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{event.shortDesc}</p>

        <div className="flex flex-col gap-1 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar size={13} className="text-slate-400 flex-shrink-0" />
            <span>{event.date} · {event.time} – {event.endTime}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin size={13} className="text-slate-400 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Building2 size={13} className="text-slate-400 flex-shrink-0" />
            <span className="truncate">{event.organizer}</span>
          </div>
        </div>

        {/* Capacity bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>{event.enrolled} inscritos</span>
            <span className={available < 20 ? "text-amber-600 font-semibold" : ""}>{available} disponibles</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-red-400" : pct >= 70 ? "bg-amber-400" : "bg-primary-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <Button onClick={(e) => { e.stopPropagation(); onClick(); }} fullWidth size="sm" variant="secondary">
          Ver detalles
        </Button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="h-44 bg-slate-200" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-3 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-200 rounded w-4/5" />
        <div className="h-3 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="h-8 bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
}

export default function ExploreEvents({ onNavigate }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [modality, setModality] = useState("all");
  const [sort, setSort] = useState("date");
  const [loading] = useState(false);

  const categories = ["all", "Tecnología", "Taller", "Charla", "Competencia"];
  const modalities = ["all", "Presencial", "Virtual", "Híbrido"];

  const filtered = events.filter(ev => {
    const q = search.toLowerCase();
    const matchSearch = !q || ev.title.toLowerCase().includes(q) || ev.shortDesc.toLowerCase().includes(q) || ev.category.toLowerCase().includes(q);
    const matchCat = category === "all" || ev.category === category;
    const matchMod = modality === "all" || ev.modality === modality;
    return matchSearch && matchCat && matchMod;
  }).sort((a, b) => sort === "date" ? a.date.localeCompare(b.date) : b.enrolled - a.enrolled);

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold font-display text-slate-900 mb-0.5">Explorar eventos</h2>
        <p className="text-sm text-slate-500">Descubre y únete a los eventos de tu comunidad universitaria.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar eventos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 h-9 rounded-xl text-sm font-medium transition-colors ${category === c ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {c === "all" ? "Todas" : c}
              </button>
            ))}
          </div>

          <select
            value={modality}
            onChange={e => setModality(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-600 outline-none"
          >
            {modalities.map(m => <option key={m} value={m}>{m === "all" ? "Modalidad" : m}</option>)}
          </select>

          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-600 outline-none"
          >
            <option value="date">Ordenar por fecha</option>
            <option value="popular">Más inscritos</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500">
        {loading ? "Cargando..." : `${filtered.length} evento${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
      </p>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Calendar size={28} className="text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">Sin resultados</h3>
          <p className="text-sm text-slate-400 text-center max-w-xs">No encontramos eventos con esos filtros. Intenta con otro término o categoría.</p>
          <Button onClick={() => { setSearch(""); setCategory("all"); setModality("all"); }} variant="secondary" size="sm" className="mt-4">
            Limpiar filtros
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(ev => (
            <EventCard key={ev.id} event={ev} onClick={() => onNavigate("event-detail")} />
          ))}
        </div>
      )}
    </div>
  );
}
