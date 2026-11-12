import { useCallback, useEffect, useMemo, useState } from "react";
import { getMyEvents } from "../../api/eventsApi";
import { getOrganizerEnrollments } from "../../api/enrollmentApi";
import type { BackendEvent } from "../../types/event";
import type { Enrollment } from "../../types/enrollment";

/**
 * Datos del organizador: sus eventos (event-service) y las inscripciones de esos eventos
 * con su último pago (enrollment-service). Se piden en paralelo, dos llamadas en total.
 */
export function useOrganizerData() {
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [evs, ins] = await Promise.all([getMyEvents(), getOrganizerEnrollments()]);
      setEvents(evs);
      setEnrollments(ins);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la información.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const eventsById = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);

  return { events, enrollments, eventsById, loading, error, reload };
}

/** Exporta filas a CSV (separado por ; para que Excel en español lo abra bien). */
export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const content = [header, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
