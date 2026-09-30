import React, { useState } from "react";
import { Check, Info, Upload } from "lucide-react";
import Button from "../../components/ui/Button";

interface Props { onNavigate: (p: string) => void }

const SECTIONS = ["Información general", "Ubicación", "Fecha y horario", "Capacidad y precio", "Imagen", "Configuración"];

export default function CreateEvent({ onNavigate }: Props) {
  const [section, setSection] = useState(0);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [form, setForm] = useState({
    title: "", description: "", category: "", modality: "Presencial",
    location: "", city: "Lima", address: "",
    date: "", startTime: "", endTime: "",
    capacity: "", price: "0", hasCost: false,
    imageUrl: "", tags: "",
    requireApproval: false, sendReminder: true, certificate: false,
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const v = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(p => ({ ...p, [k]: v }));
  };

  const handlePublish = async () => {
    setPublishing(true);
    await new Promise(r => setTimeout(r, 1200));
    setPublishing(false);
    onNavigate("my-events");
  };

  return (
    <div className="max-w-3xl flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Crear evento</h2>
          <p className="text-sm text-slate-500">Completa la información para publicar tu evento.</p>
        </div>
      </div>

      {/* Progress tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-4">
        <div className="flex gap-1 overflow-x-auto">
          {SECTIONS.map((s, i) => (
            <button
              key={s}
              onClick={() => setSection(i)}
              className={[
                "flex items-center gap-2 px-3 h-9 rounded-xl text-xs font-medium whitespace-nowrap transition-all",
                i === section ? "bg-primary-600 text-white" : i < section ? "bg-green-50 text-green-700" : "text-slate-500 hover:bg-slate-50",
              ].join(" ")}
            >
              {i < section ? <Check size={12} /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">{i + 1}</span>}
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Section content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-6">
        {section === 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-slate-900 font-display">{SECTIONS[0]}</h3>
            <Field label="Título del evento *" placeholder="ej. Congreso Internacional de IA" value={form.title} onChange={set("title")} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Descripción *</label>
              <textarea value={form.description} onChange={set("description")} rows={4} placeholder="Describe el evento en detalle..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Categoría *" value={form.category} onChange={set("category")} options={["Tecnología", "Taller", "Charla", "Competencia", "Cultural", "Deportivo"]} />
              <SelectField label="Modalidad *" value={form.modality} onChange={set("modality")} options={["Presencial", "Virtual", "Híbrido"]} />
            </div>
            <Field label="Tags (separados por coma)" placeholder="ej. IA, Python, Machine Learning" value={form.tags} onChange={set("tags")} />
          </div>
        )}

        {section === 1 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-slate-900 font-display">{SECTIONS[1]}</h3>
            <Field label="Nombre del lugar *" placeholder="ej. Auditorio Central - Campus Norte" value={form.location} onChange={set("location")} />
            <Field label="Dirección completa" placeholder="Av. Universitaria 1234" value={form.address} onChange={set("address")} />
            <SelectField label="Ciudad" value={form.city} onChange={set("city")} options={["Lima", "Arequipa", "Trujillo", "Cusco", "Piura"]} />
            <div className="h-28 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-sm">
              Mapa interactivo (Google Maps integration)
            </div>
          </div>
        )}

        {section === 2 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-slate-900 font-display">{SECTIONS[2]}</h3>
            <Field label="Fecha del evento *" type="date" value={form.date} onChange={set("date")} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Hora de inicio *" type="time" value={form.startTime} onChange={set("startTime")} />
              <Field label="Hora de fin *" type="time" value={form.endTime} onChange={set("endTime")} />
            </div>
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2 text-xs text-blue-700">
              <Info size={14} className="mt-0.5 flex-shrink-0" />
              La inscripción se cerrará automáticamente 2 horas antes del inicio del evento.
            </div>
          </div>
        )}

        {section === 3 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-slate-900 font-display">{SECTIONS[3]}</h3>
            <Field label="Capacidad máxima *" type="number" placeholder="ej. 200" value={form.capacity} onChange={set("capacity")} />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.hasCost} onChange={set("hasCost")} className="w-4 h-4 rounded border-slate-300 text-primary-600" />
              <span className="text-sm text-slate-700">Este evento tiene costo de inscripción</span>
            </label>
            {form.hasCost && (
              <Field label="Precio (S/.)" type="number" placeholder="0.00" value={form.price} onChange={set("price")} />
            )}
            {!form.hasCost && (
              <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700">
                Este evento será gratuito. Los estudiantes no pagarán por inscribirse.
              </div>
            )}
          </div>
        )}

        {section === 4 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-slate-900 font-display">{SECTIONS[4]}</h3>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-primary-300 transition-colors cursor-pointer">
              <Upload size={28} className="text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700 mb-1">Arrastra una imagen o haz clic</p>
              <p className="text-xs text-slate-400">PNG, JPG o WEBP · Máx. 5MB · Tamaño recomendado 1200×500px</p>
              <Button variant="secondary" size="sm" className="mt-3">Seleccionar archivo</Button>
            </div>
            <Field label="O ingresa una URL de imagen" placeholder="https://..." value={form.imageUrl} onChange={set("imageUrl")} />
            {form.imageUrl && (
              <img src={form.imageUrl} alt="Preview" className="w-full h-32 rounded-xl object-cover" onError={e => (e.currentTarget.style.display = "none")} />
            )}
          </div>
        )}

        {section === 5 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-slate-900 font-display">{SECTIONS[5]}</h3>
            {[
              { k: "requireApproval", l: "Requiere aprobación manual", d: "Las inscripciones deben ser aprobadas manualmente" },
              { k: "sendReminder", l: "Enviar recordatorios automáticos", d: "Notificar a los inscritos 24h y 1h antes" },
              { k: "certificate", l: "Emitir certificado de asistencia", d: "Los asistentes recibirán un certificado digital" },
            ].map(({ k, l, d }) => (
              <label key={k} className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50">
                <input type="checkbox" checked={form[k as keyof typeof form] as boolean} onChange={set(k)} className="w-4 h-4 mt-0.5 rounded border-slate-300 text-primary-600" />
                <div>
                  <p className="text-sm font-medium text-slate-800">{l}</p>
                  <p className="text-xs text-slate-400">{d}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {section > 0 && <Button onClick={() => setSection(s => s - 1)} variant="ghost">Anterior</Button>}
        {section < SECTIONS.length - 1 ? (
          <Button onClick={() => setSection(s => s + 1)} fullWidth>Siguiente</Button>
        ) : (
          <div className="flex gap-3 flex-1">
            <Button onClick={async () => { setSaving(true); await new Promise(r => setTimeout(r, 800)); setSaving(false); }} loading={saving} variant="secondary" fullWidth>
              Guardar borrador
            </Button>
            <Button onClick={handlePublish} loading={publishing} fullWidth>
              Publicar evento
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, onChange, type = "text" }: { label: string; placeholder?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <select value={value} onChange={onChange} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100">
        <option value="">Seleccionar...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
