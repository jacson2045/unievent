import React from "react";
import { ExternalLink, MapPin, Monitor, Navigation } from "lucide-react";

/** Referencia que se agrega cuando el evento no tiene dirección propia. */
const CAMPUS = "Universidad Peruana Unión";

interface Props {
  lugar: string;
  direccion?: string | null;
  modalidad?: string | null;
  /** Alto del mapa en píxeles. */
  height?: number;
  /** Muestra los botones "Abrir en Google Maps" y "Cómo llegar". */
  showActions?: boolean;
}

/** Texto que se busca en Google Maps: la dirección si existe; si no, el lugar dentro del campus. */
export function mapQuery(lugar: string, direccion?: string | null): string {
  const dir = direccion?.trim();
  if (dir) return dir;
  return `${lugar.trim()}, ${CAMPUS}`;
}

/**
 * Mapa de Google Maps embebido (no requiere clave de API) con accesos para abrir el lugar
 * y calcular la ruta. En eventos virtuales no se muestra mapa.
 */
export default function EventMap({ lugar, direccion, modalidad, height = 260, showActions = true }: Props) {
  if (modalidad === "VIRTUAL") {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-100 p-6 text-center">
        <Monitor size={28} className="text-primary-500 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-800">Evento virtual</p>
        <p className="text-xs text-slate-500 mt-1">El enlace de acceso lo comparte el organizador con los inscritos.</p>
      </div>
    );
  }

  if (!lugar.trim() && !direccion?.trim()) {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-100 p-6 text-center text-sm text-slate-500">
        <MapPin size={24} className="text-slate-400 mx-auto mb-2" />
        Lugar por confirmar
      </div>
    );
  }

  const q = encodeURIComponent(mapQuery(lugar, direccion));
  const embedUrl = `https://www.google.com/maps?q=${q}&z=16&output=embed`;
  const openUrl = `https://www.google.com/maps/search/?api=1&query=${q}`;
  const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${q}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-100" style={{ height }}>
        <iframe
          title={`Mapa: ${lugar}`}
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-2 min-w-0">
          <MapPin size={16} className="text-primary-500 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800">{lugar || "Ubicación"}</p>
            <p className="text-xs text-slate-500">{direccion?.trim() || CAMPUS}</p>
          </div>
        </div>
        {showActions && (
          <div className="flex gap-2">
            <a
              href={openUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ExternalLink size={13} /> Abrir en Google Maps
            </a>
            <a
              href={routeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              <Navigation size={13} /> Cómo llegar
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
