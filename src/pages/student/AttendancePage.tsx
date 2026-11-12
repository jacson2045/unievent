import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Calendar, CheckCircle, Clock, Download, MapPin, QrCode, RefreshCw } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { getMyEnrollmentsWithEvents, type EnrollmentWithEvent } from "../../api/enrollmentApi";
import { formatDateTime } from "../../utils/status";

interface Props {
  onNavigate: (page: string) => void;
}

function useQrDataUrl(text: string | null): string {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!text) {
      setUrl("");
      return;
    }
    let active = true;
    QRCode.toDataURL(text, { width: 320, margin: 1, errorCorrectionLevel: "M" })
      .then((u) => active && setUrl(u))
      .catch(() => active && setUrl(""));
    return () => {
      active = false;
    };
  }, [text]);
  return url;
}

export default function AttendancePage({ onNavigate }: Props) {
  const [items, setItems] = useState<EnrollmentWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const all = await getMyEnrollmentsWithEvents();
      // Solo las inscripciones confirmadas tienen código de asistencia.
      const confirmed = all
        .filter((i) => i.enrollment.estado === "CONFIRMADA" && i.enrollment.codigoAsistencia)
        .sort((a, b) => new Date(a.event?.fecha ?? 0).getTime() - new Date(b.event?.fecha ?? 0).getTime());
      setItems(confirmed);
      // Preselecciona el próximo evento al que aún no asistió.
      const next = confirmed.find(
        (i) => !i.enrollment.fechaAsistencia && i.event && new Date(i.event.fecha).getTime() > Date.now(),
      );
      setSelectedId((prev) => prev ?? next?.enrollment.id ?? confirmed[0]?.enrollment.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar tus asistencias.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const selected = useMemo(() => items.find((i) => i.enrollment.id === selectedId) ?? null, [items, selectedId]);
  const qr = useQrDataUrl(selected?.enrollment.codigoAsistencia ?? null);
  const attended = items.filter((i) => i.enrollment.fechaAsistencia).length;

  if (loading) {
    return (
      <div className="max-w-4xl bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-600">
        <RefreshCw className="animate-spin mx-auto mb-3 text-primary-600" size={28} />
        Cargando tus asistencias...
      </div>
    );
  }

  return (
    <div className="max-w-4xl flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Mis asistencias</h2>
          <p className="text-sm text-slate-500">
            Presenta tu código QR en la entrada del evento para registrar tu asistencia.
          </p>
        </div>
        <Button onClick={() => void load()} variant="ghost" size="sm" icon={<RefreshCw size={14} />}>
          Actualizar
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <QrCode size={28} className="text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">Aún no tienes códigos de asistencia</h3>
          <p className="text-sm text-slate-400 mb-4 text-center max-w-sm">
            El código QR aparece cuando tu inscripción está confirmada (evento gratuito o pago aprobado).
          </p>
          <Button onClick={() => onNavigate("my-enrollments")} size="sm">
            Ver mis inscripciones
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Lista de eventos */}
          <div className="md:col-span-2 flex flex-col gap-2">
            <p className="text-xs text-slate-500 px-1">
              Asististe a {attended} de {items.length} evento{items.length === 1 ? "" : "s"} confirmados.
            </p>
            {items.map(({ enrollment, event }) => {
              const active = enrollment.id === selectedId;
              return (
                <button
                  key={enrollment.id}
                  onClick={() => setSelectedId(enrollment.id)}
                  className={`text-left p-4 rounded-2xl border transition-all ${
                    active ? "bg-primary-50 border-primary-200 ring-2 ring-primary-100" : "bg-white border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 line-clamp-2">{event?.nombre ?? `Evento #${enrollment.eventoId}`}</p>
                    {enrollment.fechaAsistencia ? (
                      <Badge variant="attended">Asistió</Badge>
                    ) : (
                      <Badge variant="pending">Pendiente</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{formatDateTime(event?.fecha)}</p>
                </button>
              );
            })}
          </div>

          {/* QR */}
          {selected && (
            <div className="md:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-6 flex flex-col items-center text-center">
              <div className="w-full p-4 bg-primary-50 rounded-xl text-left mb-6">
                <p className="font-semibold text-slate-900 text-sm">{selected.event?.nombre}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {formatDateTime(selected.event?.fecha)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={11} />
                    {selected.event?.lugar}
                  </span>
                </div>
              </div>

              {selected.enrollment.fechaAsistencia ? (
                <div className="py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={40} className="text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">Asistencia registrada</h3>
                  <p className="text-sm text-slate-500 mt-1">{formatDateTime(selected.enrollment.fechaAsistencia)}</p>
                </div>
              ) : (
                <>
                  <div className="w-60 h-60 bg-white border-2 border-slate-900 rounded-2xl p-3 mb-4 shadow-[0_4px_12px_-2px_rgb(0_0_0/0.12)] flex items-center justify-center">
                    {qr ? (
                      <img src={qr} alt={`Código QR ${selected.enrollment.codigoAsistencia}`} className="w-full h-full" />
                    ) : (
                      <RefreshCw className="animate-spin text-slate-400" size={24} />
                    )}
                  </div>
                  <p className="font-mono text-lg font-bold tracking-wider text-slate-900">
                    {selected.enrollment.codigoAsistencia}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 mb-5 flex items-center gap-1">
                    <Clock size={11} /> Si no se puede escanear, el organizador puede escribir este código.
                  </p>
                  {qr && (
                    <a
                      href={qr}
                      download={`qr-${selected.enrollment.codigoAsistencia}.png`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-800"
                    >
                      <Download size={14} /> Descargar QR
                    </a>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
