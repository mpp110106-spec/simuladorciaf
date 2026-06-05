import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import {
  ArrowLeft, User, IdCard, GraduationCap, Phone, Mail, MapPin, Building2, Calendar,
  Clock, UserCheck, Tag, MessageSquare, FileSignature, CreditCard, ExternalLink,
  CheckCircle2, XCircle, Loader2, Send, Pencil, Save, X,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

import { detalleService, FORMULARIO_CREDITO_PUBLICO } from "@/services/detalleService";
import { getProgramaAcademico } from "@/lib/programas";
import { formatCurrencyCO } from "@/lib/formatters";
import type { TurnoDetalle } from "@/types/turno";

const SEDE_META: Record<string, { titulo: string; direccion: string }> = {
  CRAI: { titulo: "Sede CRAI", direccion: "Cl. 20 #4-57" },
  SEXTA: { titulo: "Sede Sexta", direccion: "Cra. 6 #24-56" },
};

const ESTADO_BADGE: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-800 border-amber-200",
  en_proceso: "bg-[#0699d9]/15 text-[#013084] border-[#0699d9]/30",
  finalizado: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelado: "bg-rose-100 text-rose-800 border-rose-200",
};

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  en_proceso: "En atención",
  finalizado: "Atendido",
  cancelado: "Cancelado",
};

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Section({ title, icon: Icon, children, action }: { title: string; icon: any; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card className="p-5 border-white/40 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#001550]/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#013084]" />
          </div>
          <h3 className="font-semibold text-[#001550]">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className={`text-sm text-slate-800 mt-0.5 ${mono ? "font-mono" : ""}`}>{value ?? "—"}</div>
    </div>
  );
}

export default function TurnoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<TurnoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [obsTexto, setObsTexto] = useState("");
  const [savingObs, setSavingObs] = useState(false);
  const [editingDoc, setEditingDoc] = useState(false);
  const [docDraft, setDocDraft] = useState("");
  const [savingDoc, setSavingDoc] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      const d = await detalleService.get(id);
      setData(d);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar el turno");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void refresh(); }, [refresh]);

  const t = data?.turno;
  const sedeCodigo = t?.sede_codigo ?? "";
  const sedeInfo = sedeCodigo ? SEDE_META[sedeCodigo] : null;
  const programa = useMemo(
    () => (t ? getProgramaAcademico(t.carrera, t.semestre ?? undefined) : null),
    [t],
  );

  const handleAddObs = async () => {
    if (!id || !obsTexto.trim()) return;
    setSavingObs(true);
    try {
      await detalleService.addObservacion(id, obsTexto.trim());
      setObsTexto("");
      toast.success("Observación registrada");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSavingObs(false);
    }
  };

  const handleCredito = async (val: boolean) => {
    if (!id) return;
    try {
      await detalleService.markCredito(id, val);
      toast.success(val ? "Solicitud de crédito marcada" : "Marca de crédito removida");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar");
    }
  };

  const handleFirma = async (val: boolean) => {
    if (!id) return;
    try {
      await detalleService.markFirma(id, val);
      toast.success(val ? "Firma registrada" : "Firma removida");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar");
    }
  };

  const handleSaveDoc = async () => {
    if (!id) return;
    setSavingDoc(true);
    try {
      await detalleService.setDocumento(id, docDraft);
      toast.success("Documento actualizado");
      setEditingDoc(false);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSavingDoc(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#013084]" />
      </div>
    );
  }

  if (!data || !t) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <Card className="max-w-md p-8 text-center">
          <h2 className="text-lg font-bold text-[#001550]">Turno no encontrado</h2>
          <p className="text-sm text-slate-600 mt-2">No tienes acceso o el turno no existe.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Volver</Button>
        </Card>
      </div>
    );
  }

  const numeroFmt = String(t.numero ?? 0).padStart(3, "0");
  const estadoCls = ESTADO_BADGE[t.estado] ?? ESTADO_BADGE.pendiente;
  const estadoLabel = ESTADO_LABEL[t.estado] ?? t.estado;

  return (
    <>
      <Helmet>
        <title>Turno #{numeroFmt} · {t.nombre} | CIAF</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#001550]/5 via-slate-50 to-[#0699d9]/5">
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-white/40">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-slate-600">
                <ArrowLeft className="w-4 h-4 mr-1" /> Volver
              </Button>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Detalle del turno</div>
                <div className="text-lg font-bold text-[#001550] leading-tight">
                  #{numeroFmt} · {t.nombre}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${estadoCls} border`}>{estadoLabel}</Badge>
              {sedeInfo && (
                <Badge className="bg-[#001550] text-white border-transparent">
                  <Building2 className="w-3 h-3 mr-1" /> {sedeInfo.titulo}
                </Badge>
              )}
              <Badge className={t.firmado ? "bg-emerald-100 text-emerald-800 border-emerald-200 border" : "bg-rose-50 text-rose-700 border-rose-200 border"}>
                {t.firmado ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                Firma {t.firmado ? "Sí" : "No"}
              </Badge>
              <Badge className={t.credito_solicitado ? "bg-emerald-100 text-emerald-800 border-emerald-200 border" : "bg-slate-100 text-slate-600 border-slate-200 border"}>
                <CreditCard className="w-3 h-3 mr-1" />
                Crédito {t.credito_solicitado ? "Sí" : "No"}
              </Badge>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-5">
            {/* Información del estudiante */}
            <Section
              title="Información del estudiante"
              icon={User}
              action={
                !editingDoc && (
                  <Button variant="ghost" size="sm" onClick={() => { setDocDraft(t.documento_identidad ?? ""); setEditingDoc(true); }}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Documento
                  </Button>
                )
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nombre completo" value={t.nombre} />
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
                    <IdCard className="w-3 h-3" /> Documento de identidad
                  </div>
                  {editingDoc ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={docDraft}
                        onChange={(e) => setDocDraft(e.target.value)}
                        placeholder="Ej. 1088123456"
                        className="h-9"
                      />
                      <Button size="sm" onClick={handleSaveDoc} disabled={savingDoc} className="bg-[#001550] text-white">
                        {savingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingDoc(false)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-800 mt-0.5 font-mono">{t.documento_identidad ?? "—"}</div>
                  )}
                </div>
                <Field
                  label="Programa académico"
                  value={
                    <span className="flex items-start gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 mt-0.5 text-[#013084]" />
                      <span>
                        <span className="font-medium">{t.carrera ?? "—"}</span>
                        {t.semestre ? ` · ${t.semestre}° sem` : ""}
                        {programa && <div className="text-xs text-slate-500">{programa}</div>}
                      </span>
                    </span>
                  }
                />
                <Field
                  label="Contacto"
                  value={
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {t.telefono}</div>
                      {t.correo && <div className="flex items-center gap-1.5 text-slate-600"><Mail className="w-3.5 h-3.5 text-slate-400" /> {t.correo}</div>}
                    </div>
                  }
                />
              </div>
            </Section>

            {/* Información del turno */}
            <Section title="Información del turno" icon={Calendar}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Número" value={<span className="font-bold text-[#001550]">#{numeroFmt}</span>} />
                <Field label="Fecha" value={t.turno_fecha ? new Date(t.turno_fecha + "T00:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }) : "—"} />
                <Field label="Hora de creación" value={new Date(t.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })} />
                <Field label="Asesora" value={t.asesor_nombre ? <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-emerald-600" /> {t.asesor_nombre}</span> : <span className="text-slate-400">Sin asignar</span>} />
                <Field
                  label="Sede"
                  value={
                    sedeInfo ? (
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-[#001550] text-white border-transparent">{sedeInfo.titulo}</Badge>
                      </div>
                    ) : "—"
                  }
                />
                <Field label="Dirección" value={sedeInfo ? <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {sedeInfo.direccion}</span> : "—"} />
                <Field label="Modalidad" value={<Badge variant="outline" className="text-xs">Presencial</Badge>} />
                <Field label="Estado" value={<Badge className={`${estadoCls} border`}>{estadoLabel}</Badge>} />
                <Field label="Prioridad" value={<span className="capitalize">{String(t.prioridad)}</span>} />
              </div>
            </Section>

            {/* Detalle de la atención */}
            <Section title="Detalle de la atención" icon={Tag}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Tipo de solicitud" value={<Badge variant="outline">{t.tipificacion}</Badge>} />
                <Field label="Valor de simulación" value={t.simulacion_valor ? formatCurrencyCO(t.simulacion_valor) : "—"} />
                <Field label="Inicio de atención" value={formatDateTime(t.atencion_inicio)} />
                <Field label="Fin de atención" value={formatDateTime(t.atencion_fin)} />
                {t.observaciones && (
                  <div className="sm:col-span-2">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Resumen al cierre</div>
                    <div className="text-sm text-slate-700 mt-1 rounded-lg bg-slate-50 border p-3 whitespace-pre-wrap">{t.observaciones}</div>
                  </div>
                )}
                {data.financiacion && (
                  <div className="sm:col-span-2">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Estado financiero</div>
                    <div className="text-sm mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{data.financiacion.estado}</Badge>
                      {data.financiacion.monto_solicitado && (
                        <span className="text-slate-600">Monto: {formatCurrencyCO(data.financiacion.monto_solicitado)}</span>
                      )}
                      {data.financiacion.cuotas && <span className="text-slate-600">· {data.financiacion.cuotas} cuotas</span>}
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* Observaciones / Timeline */}
            <Section title="Observaciones de la asesora" icon={MessageSquare}>
              <div className="space-y-3">
                <div className="rounded-xl border bg-slate-50 p-3">
                  <Textarea
                    rows={3}
                    value={obsTexto}
                    onChange={(e) => setObsTexto(e.target.value)}
                    placeholder="Registra una nueva observación de seguimiento…"
                    className="bg-white"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      onClick={handleAddObs}
                      disabled={savingObs || !obsTexto.trim()}
                      className="bg-[#001550] hover:bg-[#013084] text-white"
                    >
                      {savingObs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Agregar observación
                    </Button>
                  </div>
                </div>

                {data.observaciones.length === 0 ? (
                  <div className="text-center text-sm text-slate-400 py-6">Aún no hay observaciones registradas.</div>
                ) : (
                  <ol className="relative border-l-2 border-[#0699d9]/30 ml-2 space-y-4 pt-1">
                    {data.observaciones.map((o) => (
                      <li key={o.id} className="ml-4">
                        <span className="absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full bg-[#0699d9] ring-4 ring-white" />
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-[#001550]">{o.autor_nombre}</span>
                          <Badge variant="outline" className="text-[10px] uppercase">{o.autor_rol}</Badge>
                          <span className="text-xs text-slate-500">{formatDateTime(o.created_at)}</span>
                        </div>
                        <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap rounded-lg bg-white border p-3 shadow-sm">{o.texto}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </Section>
          </div>

          {/* Sidebar: resumen + acciones */}
          <aside className="space-y-5">
            <Card className="p-5 bg-gradient-to-br from-[#001550] to-[#013084] text-white border-transparent shadow-lg">
              <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Resumen rápido</div>
              <div className="mt-3 space-y-3 text-sm">
                <Row label="Estado" value={<Badge className="bg-white/15 text-white border-white/20">{estadoLabel}</Badge>} />
                <Row label="Sede" value={<Badge className="bg-white text-[#001550] border-transparent">{sedeInfo?.titulo ?? "—"}</Badge>} />
                <Row label="Firma" value={
                  <span className="inline-flex items-center gap-1">
                    {t.firmado ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <XCircle className="w-4 h-4 text-rose-300" />}
                    {t.firmado ? "Sí" : "No"}
                  </span>
                } />
                <Row label="Crédito" value={
                  <span className="inline-flex items-center gap-1">
                    {t.credito_solicitado ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <XCircle className="w-4 h-4 text-white/40" />}
                    {t.credito_solicitado ? "Sí" : "No"}
                  </span>
                } />
                <Row label="Última actualización" value={<span className="text-white/80 text-xs">{formatDateTime(t.updated_at)}</span>} />
              </div>
            </Card>

            {/* Estado de firma */}
            <Section title="Estado de firma" icon={FileSignature}>
              <div className="flex items-center justify-between rounded-xl border p-3 bg-slate-50">
                <div>
                  <div className="text-sm font-medium text-slate-800">¿Estudiante firmó?</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {t.firmado && t.firmado_at ? `Firmado el ${formatDateTime(t.firmado_at)}` : "Sin registro de firma"}
                  </div>
                </div>
                <Switch checked={!!t.firmado} onCheckedChange={handleFirma} />
              </div>
            </Section>

            {/* Solicitud de crédito */}
            <Section title="Solicitud de crédito" icon={CreditCard}>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border p-3 bg-slate-50">
                  <div>
                    <div className="text-sm font-medium text-slate-800">¿Realizada?</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {t.credito_solicitado && t.credito_solicitado_at
                        ? `Marcada el ${formatDateTime(t.credito_solicitado_at)}`
                        : "Aún no marcada"}
                    </div>
                  </div>
                  <Switch checked={!!t.credito_solicitado} onCheckedChange={handleCredito} />
                </div>

                <a
                  href={FORMULARIO_CREDITO_PUBLICO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-[#0699d9]/30 bg-gradient-to-br from-[#0699d9]/10 to-[#013084]/5 p-3 hover:border-[#0699d9] transition-all"
                >
                  <div>
                    <div className="text-sm font-semibold text-[#001550]">Formulario de inscripción</div>
                    <div className="text-xs text-slate-600 mt-0.5">ciaf.digital/inscribete</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#013084]" />
                </a>
              </div>
            </Section>
          </aside>
        </main>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/70 text-xs uppercase tracking-wider">{label}</span>
      <span>{value}</span>
    </div>
  );
}