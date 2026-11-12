import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, CameraOff, CheckCircle, Keyboard, RefreshCw, UserCheck, XCircle } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { checkInByCode, checkInByEnrollment } from "../../api/enrollmentApi";
import { formatDateTime } from "../../utils/status";
import { useOrganizerData } from "./useOrganizerData";

interface Props {
  initialEventId?: number | null;
}

type Feedback = { ok: boolean; title: string; detail: string } | null;

/** Lector de QR con la cámara: decodifica cada cuadro con jsQR y avisa el texto leído. */
function useQrScanner(active: boolean, onCode: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState("");
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;
    setCameraError("");

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (stopped || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const tick = () => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (stopped || !video || !canvas) return;
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const result = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
              if (result?.data) onCodeRef.current(result.data);
            }
          }
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      } catch (err) {
        setCameraError(
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Permiso de cámara denegado. Puedes escribir el código manualmente."
            : "No se pudo abrir la cámara. Puedes escribir el código manualmente.",
        );
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active]);

  return { videoRef, canvasRef, cameraError };
}

export default function AttendanceControl({ initialEventId = null }: Props) {
  const { events, enrollments, eventsById, loading, error, reload } = useOrganizerData();
  const [eventId, setEventId] = useState<string>(initialEventId ? String(initialEventId) : "");
  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const lastScan = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  const selectableEvents = useMemo(() => events.filter((e) => e.estado !== "CANCELADO"), [events]);

  // Al cargar, se preselecciona el evento más próximo.
  useEffect(() => {
    if (eventId || selectableEvents.length === 0) return;
    const upcoming = [...selectableEvents].sort(
      (a, b) => Math.abs(new Date(a.fecha).getTime() - Date.now()) - Math.abs(new Date(b.fecha).getTime() - Date.now()),
    );
    setEventId(String(upcoming[0].id));
  }, [selectableEvents, eventId]);

  const confirmed = useMemo(
    () => enrollments.filter((e) => e.eventoId === Number(eventId) && e.estado === "CONFIRMADA"),
    [enrollments, eventId],
  );
  const attendedCount = confirmed.filter((e) => e.fechaAsistencia).length;

  const handleResult = useCallback(
    async (action: () => Promise<{ estudianteCorreo: string; fechaAsistencia: string }>) => {
      setBusy(true);
      try {
        const r = await action();
        setFeedback({ ok: true, title: "Asistencia registrada", detail: `${r.estudianteCorreo} · ${formatDateTime(r.fechaAsistencia)}` });
        await reload();
      } catch (err) {
        setFeedback({ ok: false, title: "No se registró", detail: err instanceof Error ? err.message : "Error desconocido" });
      } finally {
        setBusy(false);
      }
    },
    [reload],
  );

  const submitCode = (value: string) => {
    const clean = value.trim();
    if (!clean || busy) return;
    void handleResult(() => checkInByCode(clean, eventId ? Number(eventId) : undefined));
  };

  const onScan = useCallback(
    (value: string) => {
      // Evita registrar el mismo QR muchas veces mientras sigue frente a la cámara.
      const now = Date.now();
      if (value === lastScan.current.code && now - lastScan.current.at < 4000) return;
      lastScan.current = { code: value, at: now };
      setCode(value);
      submitCode(value);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventId, busy],
  );

  const { videoRef, canvasRef, cameraError } = useQrScanner(scanning, onScan);

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Control de asistencia</h2>
          <p className="text-sm text-slate-500">Escanea el QR del estudiante o escribe su código.</p>
        </div>
        <Button onClick={() => void reload()} variant="ghost" size="sm" icon={<RefreshCw size={14} />} disabled={loading}>
          Actualizar
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] flex flex-wrap items-center gap-3">
        <select
          value={eventId}
          onChange={(e) => {
            setEventId(e.target.value);
            setFeedback(null);
          }}
          className="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-700 outline-none min-w-64"
        >
          {selectableEvents.length === 0 && <option value="">No tienes eventos activos</option>}
          {selectableEvents.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.nombre} — {formatDateTime(ev.fecha)}
            </option>
          ))}
        </select>
        {eventId && (
          <span className="text-sm text-slate-600">
            <strong className="text-slate-900">{attendedCount}</strong> de {confirmed.length} confirmados asistieron
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Lector */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-5 flex flex-col gap-4">
          <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
            <video ref={videoRef} muted playsInline className={`w-full h-full object-cover ${scanning ? "" : "hidden"}`} />
            <canvas ref={canvasRef} className="hidden" />
            {!scanning && (
              <div className="text-center text-slate-400">
                <Camera size={36} className="mx-auto mb-2" />
                <p className="text-sm">Cámara apagada</p>
              </div>
            )}
            {scanning && <div className="absolute inset-10 border-2 border-white/70 rounded-xl pointer-events-none" />}
          </div>
          {cameraError && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">{cameraError}</p>}
          <Button
            onClick={() => setScanning((s) => !s)}
            variant={scanning ? "secondary" : "primary"}
            icon={scanning ? <CameraOff size={16} /> : <Camera size={16} />}
            disabled={!eventId}
            fullWidth
          >
            {scanning ? "Detener cámara" : "Escanear con la cámara"}
          </Button>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitCode(code);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Keyboard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="UEP-XXXX-XXXX"
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm font-mono bg-white text-slate-900 outline-none focus:border-primary-500"
              />
            </div>
            <Button type="submit" loading={busy} disabled={!eventId || !code.trim()}>
              Registrar
            </Button>
          </form>

          {feedback && (
            <div
              className={`flex items-start gap-3 rounded-xl p-4 border ${
                feedback.ok ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {feedback.ok ? <CheckCircle size={20} className="flex-shrink-0" /> : <XCircle size={20} className="flex-shrink-0" />}
              <div>
                <p className="font-semibold text-sm">{feedback.title}</p>
                <p className="text-sm">{feedback.detail}</p>
              </div>
            </div>
          )}
        </div>

        {/* Lista */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 font-display">
              Confirmados {eventId && eventsById.get(Number(eventId)) ? `· ${eventsById.get(Number(eventId))!.nombre}` : ""}
            </h3>
          </div>
          {loading ? (
            <p className="px-5 py-8 text-sm text-slate-400 text-center">Cargando...</p>
          ) : confirmed.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500 text-center">No hay inscripciones confirmadas en este evento.</p>
          ) : (
            <div className="max-h-[480px] overflow-y-auto">
              {confirmed.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {e.estudianteCorreo.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 truncate">{e.estudianteCorreo}</p>
                    <p className="text-xs text-slate-400">
                      {e.fechaAsistencia ? `Ingresó ${formatDateTime(e.fechaAsistencia)}` : `Inscripción #${e.id}`}
                    </p>
                  </div>
                  {e.fechaAsistencia ? (
                    <Badge variant="attended">Asistió</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<UserCheck size={14} />}
                      disabled={busy}
                      onClick={() => void handleResult(() => checkInByEnrollment(e.id))}
                    >
                      Marcar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
