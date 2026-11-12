import React, { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Search, Building2, RefreshCw, Users } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { getEvents } from "../../api/eventsApi";
import { MODALITY_LABELS, type BackendEvent } from "../../types/event";

interface Props {
  onNavigate: (page: string) => void;
  onSelectEvent?: (id: number) => void;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function EventCard({
  event,
  onClick,
}: {
  event: BackendEvent;
  onClick: () => void;
}) {
  const soldOut = event.cuposDisponibles <= 0;
  const finished = new Date(event.fecha).getTime() < Date.now();

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] overflow-hidden group hover:shadow-[0_4px_12px_-2px_rgb(0_0_0/0.1)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-44 bg-gradient-to-br from-primary-700 to-violet-800 overflow-hidden flex items-center justify-center">
        {event.imagenUrl ? (
          <img
            src={event.imagenUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <Calendar size={56} className="text-white/70" />
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {finished ? (
            <Badge variant="pending" dot>Finalizado</Badge>
          ) : soldOut ? (
            <Badge variant="rejected" dot>Agotado</Badge>
          ) : (
            <Badge variant="active" dot>Disponible</Badge>
          )}
          {event.modalidad && (
            <span className="bg-white/90 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {MODALITY_LABELS[event.modalidad]}
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          {Number(event.precio) > 0 ? (
            <span className="bg-white/95 text-primary-700 font-bold text-sm px-3 py-1 rounded-full shadow-sm">
              S/ {Number(event.precio).toFixed(2)}
            </span>
          ) : (
            <Badge variant="free">Gratuito</Badge>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="mb-2">
          <span className="text-xs text-violet-600 font-semibold bg-violet-50 px-2 py-0.5 rounded-lg">
            {event.categoria?.nombre ?? "Sin categoría"}
          </span>
        </div>

        <h3 className="font-semibold text-slate-900 font-display leading-snug mb-1 line-clamp-2 group-hover:text-primary-700 transition-colors">
          {event.nombre}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
          {event.descripcionCorta || event.descripcion || "No hay descripción disponible."}
        </p>

        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-start gap-1.5 text-xs text-slate-500">
            <Calendar size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <span>{formatDate(event.fecha)}</span>
          </div>
          <div className="flex items-start gap-1.5 text-xs text-slate-500">
            <MapPin size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="truncate">{event.lugar || "Lugar por confirmar"}</span>
          </div>
          {event.organizador && (
            <div className="flex items-start gap-1.5 text-xs text-slate-500">
              <Building2 size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <span className="truncate">{event.organizador}</span>
            </div>
          )}
          <div className="flex items-start gap-1.5 text-xs text-slate-500">
            <Users size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <span>
              {soldOut
                ? "Sin cupos disponibles"
                : `${event.cuposDisponibles} de ${event.capacidad} cupos disponibles`}
            </span>
          </div>
        </div>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          fullWidth
          size="sm"
          variant="secondary"
        >
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
        <div className="h-8 bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
}

export default function ExploreEvents({ onNavigate, onSelectEvent }: Props) {
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("date");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      setLoading(true);
      setError("");

      try {
        const result = await getEvents();
        if (active) setEvents(result);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los eventos.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadEvents();

    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(
          events
            .map((event) => event.categoria?.nombre)
            .filter((name): name is string => Boolean(name)),
        ),
      ),
    ],
    [events],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("es");

    return events
      .filter((event) => {
        const searchable = [
          event.nombre,
          event.descripcion,
          event.categoria?.nombre,
          event.lugar,
          event.organizador,
          ...(event.tags ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("es");

        const matchesSearch = !q || searchable.includes(q);
        const matchesCategory =
          category === "all" || event.categoria?.nombre === category;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        // Los eventos finalizados van al final de la lista.
        const now = Date.now();
        const aPast = new Date(a.fecha).getTime() < now ? 1 : 0;
        const bPast = new Date(b.fecha).getTime() < now ? 1 : 0;
        if (aPast !== bPast) return aPast - bPast;
        return sort === "date"
          ? new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
          : a.nombre.localeCompare(b.nombre, "es");
      });
  }, [events, search, category, sort]);

  const openEvent = (id: number) => {
    if (onSelectEvent) {
      onSelectEvent(id);
    } else {
      onNavigate("event-detail");
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold font-display text-slate-900 mb-0.5">
          Explorar eventos
        </h2>
        <p className="text-sm text-slate-500">
          Descubre y únete a los eventos de tu comunidad universitaria.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar eventos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`px-3 h-9 rounded-xl text-sm font-medium transition-colors ${
                  category === item
                    ? "bg-primary-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item === "all" ? "Todas" : item}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-600 outline-none"
          >
            <option value="date">Ordenar por fecha</option>
            <option value="name">Ordenar por nombre</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        {loading
          ? "Cargando eventos..."
          : `${filtered.length} evento${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <p className="font-semibold mb-2">No se pudieron cargar los eventos</p>
          <p>{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="secondary"
            size="sm"
            className="mt-3"
            icon={<RefreshCw size={14} />}
          >
            Reintentar
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !error && filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Calendar size={28} className="text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">Sin resultados</h3>
          <p className="text-sm text-slate-400 text-center max-w-xs">
            No encontramos eventos con esos filtros. Prueba con otro término.
          </p>
          <Button
            onClick={() => {
              setSearch("");
              setCategory("all");
            }}
            variant="secondary"
            size="sm"
            className="mt-4"
          >
            Limpiar filtros
          </Button>
        </div>
      ) : !error ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => openEvent(event.id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}