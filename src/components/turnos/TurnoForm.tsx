import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Loader2, CheckCircle2, User, Phone, Mail, Tag, GraduationCap, BookOpen, Sparkles, Globe, CreditCard, FileText, ArrowRight, Clock, Zap } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { turnoSchema, type TurnoFormData } from "@/lib/validations";
import { TIPIFICACIONES, CARRERAS } from "@/lib/constants";
import { turnosService } from "@/services/turnosService";
import { useTracking } from "@/hooks/useTracking";
import { getProgramaAcademico, getNivelAcademico, getSemestresDisponibles, getMaxSemestre } from "@/lib/programas";
import { useFlow } from "@/stores/flowStore";
import { useEffect } from "react";
import SedeSelector from "@/components/turnos/SedeSelector";
import { toast as sonnerToast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

interface TurnoFormProps {
  simulacionValor?: number | null;
  onSuccess?: (turno: {
    id: string;
    numero: number;
    asesor_nombre?: string | null;
    personas_delante?: number;
    tiempo_estimado_min?: number;
    tipificacion?: string;
    carrera?: string;
    semestre?: number;
    programa?: string | null;
  }) => void;
}

const TurnoForm = ({ simulacionValor, onSuccess }: TurnoFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [virtualFallback, setVirtualFallback] = useState<null | { reason: "no_advisor" | "out_of_hours" }>(null);
  const navigate = useNavigate();
  const { track } = useTracking();
  const { state: flowState, setDatos, setModalidad } = useFlow();
  // Idempotency key: stable per form mount → protege contra doble submit, refresh y reintentos
  const idempotencyKeyRef = useRef<string>(
    (typeof crypto !== "undefined" && "randomUUID" in crypto)
      ? crypto.randomUUID()
      : `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  // Última respuesta del backend procesada → evita duplicar UI ante reintentos idempotentes
  const lastHandledTurnoIdRef = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TurnoFormData>({
    resolver: zodResolver(turnoSchema),
    mode: "onBlur",
    defaultValues: {
      nombre: flowState.datos.nombre ?? "",
      telefono: flowState.datos.telefono ?? "",
      correo: flowState.datos.correo ?? "",
      tipificacion: (flowState.datos.tipificacion ?? undefined) as unknown as TurnoFormData["tipificacion"],
      carrera: (flowState.datos.carrera ?? undefined) as unknown as string,
      semestre: (flowState.datos.semestre ?? undefined) as unknown as number,
    },
  });

  const tipificacion = watch("tipificacion");
  const carrera = watch("carrera");
  const semestre = watch("semestre");
  const nombreW = watch("nombre");
  const telefonoW = watch("telefono");
  const correoW = watch("correo");

  // Persistir cambios en el store para no perderlos al navegar
  useEffect(() => {
    setDatos({
      nombre: nombreW,
      telefono: telefonoW,
      correo: correoW,
      tipificacion,
      carrera,
      semestre,
    });
  }, [nombreW, telefonoW, correoW, tipificacion, carrera, semestre, setDatos]);

  // Si cambia la carrera y el semestre actual excede el máximo permitido, reseteamos
  useEffect(() => {
    if (!carrera || !semestre) return;
    const max = getMaxSemestre(carrera);
    if (semestre > max) {
      setValue("semestre", undefined as unknown as number, { shouldValidate: false });
    }
  }, [carrera, semestre, setValue]);

  const semestresDisponibles = getSemestresDisponibles(carrera);

  const onSubmit = async (data: TurnoFormData) => {
    if (!flowState.sedeId) {
      sonnerToast.error("Selecciona tu sede antes de continuar");
      return;
    }
    setSubmitting(true);
    try {
      const turno = await turnosService.create({
        nombre: data.nombre.trim(),
        telefono: data.telefono.trim(),
        correo: data.correo.trim(),
        tipificacion: data.tipificacion,
        carrera: data.carrera,
        semestre: data.semestre,
        simulacion_valor: simulacionValor ?? null,
        sede_id: flowState.sedeId,
        idempotency_key: idempotencyKeyRef.current,
      });
      // Nota: con el modelo de cola manual, asesor_id es NULL en la creación.
      // La asesora reclama el turno desde su panel (take_turno). No mostramos
      // el fallback virtual aquí: la disponibilidad se valida por la cola de sede.
      // Detección de respuesta idempotente:
      // - misma id que el turno activo en el store
      // - o misma id que ya procesamos en esta sesión del formulario
      const isReplay =
        lastHandledTurnoIdRef.current === turno.id ||
        flowState.turno?.id === turno.id;
      lastHandledTurnoIdRef.current = turno.id;

      const numeroFmt = String(turno.numero ?? 0).padStart(3, "0");
      const asesoraTxt = turno.asesor_nombre ? ` · ${turno.asesor_nombre}` : "";

      if (isReplay) {
        // No re-trackear ni re-celebrar: solo confirmar suavemente
        toast.info(`Ya tenías el turno ${numeroFmt} registrado`, {
          description: turno.asesor_nombre
            ? `Continuamos con tu asesora ${turno.asesor_nombre}.`
            : "Te llevamos a tu turno actual.",
        });
      } else {
        track("turno_creado", { tipificacion: data.tipificacion, turno_id: turno.id });
        toast.success(`¡Turno ${numeroFmt} asignado!${asesoraTxt}`, {
          description: turno.asesor_nombre
            ? `Tu asesora asignada: ${turno.asesor_nombre}.`
            : "Guarda tu número de turno. Un asesor CIAF te contactará pronto.",
        });
      }

      // onSuccess es idempotente (navega/actualiza al mismo turno) → siempre lo invocamos
      if (onSuccess) {
        onSuccess({
          id: turno.id,
          numero: turno.numero,
          asesor_nombre: turno.asesor_nombre ?? null,
          personas_delante: turno.personas_delante ?? 0,
          tiempo_estimado_min: turno.tiempo_estimado_min ?? 0,
          tipificacion: data.tipificacion,
          carrera: data.carrera,
          semestre: data.semestre,
          programa: getProgramaAcademico(data.carrera, data.semestre),
        });
      } else {
        setDone(true);
      }
    } catch (e) {
      // Si el backend lanza una violación de unicidad por la idempotency_key
      // (carrera entre dos requests concurrentes), tratamos como replay silencioso
      // en lugar de mostrar un error al usuario.
      const msg = e instanceof Error ? e.message : String(e);
      const isIdempotencyCollision =
        /idempotency|duplicate key|uq_turnos_idempotency|unique constraint/i.test(msg);

      if (isIdempotencyCollision && flowState.turno) {
        toast.info("Tu turno ya estaba registrado", {
          description: "Te mostramos el turno existente.",
        });
        if (onSuccess) {
          onSuccess({
            id: flowState.turno.id,
            numero: flowState.turno.numero,
            asesor_nombre: flowState.turno.asesor_nombre ?? null,
            personas_delante: flowState.turno.personas_delante ?? 0,
            tiempo_estimado_min: flowState.turno.tiempo_estimado_min ?? 0,
            tipificacion: data.tipificacion,
            carrera: data.carrera,
            semestre: data.semestre,
            programa: getProgramaAcademico(data.carrera, data.semestre),
          });
        }
      } else {
        console.error("Error registrando turno", e);
        toast.error("No pudimos registrar tu turno", {
          description: msg || "Inténtalo nuevamente.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mt-6 flex flex-col gap-6 animate-fade-in">
        {/* Mensaje de confirmación */}
        <Card className="border-ciaf-blue/20">
          <CardContent className="py-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-ciaf-blue-light flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-ciaf-blue" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-foreground">
                ¡Tu turno ha sido solicitado con éxito!
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Un asesor de CIAF se pondrá en contacto contigo pronto para brindarte atención personalizada.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sección: Adelanta tu Proceso */}
        <Card className="border-ciaf-blue/30 shadow-md bg-gradient-to-br from-ciaf-blue/[0.03] to-ciaf-light-blue/[0.06]">
          <CardContent className="py-6 px-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-ciaf-blue" />
              <h4 className="text-base font-semibold text-ciaf-blue">
                ¿Quieres adelantar tu proceso?
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Botón Pagar Cuota Inicial */}
              <button
                type="button"
                onClick={() => navigate("/financiacion")}
                className="group relative flex flex-col items-start gap-2 rounded-xl border border-ciaf-blue/20 bg-white p-4 text-left transition-all hover:border-ciaf-blue/40 hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-ciaf-blue/30"
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ciaf-blue text-white">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Pagar Cuota Inicial</span>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Realiza el pago de tu cuota inicial de forma segura y rápida en línea.
                </p>
              </button>

              {/* Botón Llenar Formulario de Crédito */}
              <a
                href="https://ciaf.digital/inscribete/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col items-start gap-2 rounded-xl border border-ciaf-blue/20 bg-white p-4 text-left transition-all hover:border-ciaf-blue/40 hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-ciaf-blue/30"
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ciaf-light-blue text-white">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Llenar Formulario de Crédito</span>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Completa tu estudio de crédito para agilizar tu financiación.
                </p>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Recordatorio de espera (discreto) */}
        <div className="flex items-start gap-3 rounded-lg border border-muted/60 bg-muted/30 p-4">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Si lo prefieres, espera la llamada de nuestro asesor para recibir asistencia personalizada.
          </p>
        </div>

        {/* Reset */}
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setDone(false)}>
            Solicitar otro turno
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
    <Card className="mt-6 border-ciaf-blue/20 shadow-sm">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-ciaf-blue-light flex items-center justify-center shrink-0">
            <CalendarClock className="w-5 h-5 text-ciaf-blue" />
          </div>
          <div>
            <CardTitle className="text-xl text-ciaf-blue">Solicita tu turno</CardTitle>
            <CardDescription>
              Déjanos tus datos y un asesor CIAF te contactará para continuar con tu proceso.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <SedeSelector />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-nombre" className="flex items-center gap-2 text-foreground font-medium">
              <User className="w-4 h-4 text-ciaf-blue" /> Nombre completo
            </Label>
            <Input
              id="t-nombre"
              placeholder="Ej. María Pérez"
              autoComplete="name"
              disabled={submitting}
              aria-invalid={!!errors.nombre}
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="text-xs text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="t-telefono" className="flex items-center gap-2 text-foreground font-medium">
              <Phone className="w-4 h-4 text-ciaf-blue" /> Teléfono
            </Label>
            <Input
              id="t-telefono"
              type="tel"
              placeholder="3001234567"
              autoComplete="tel"
              inputMode="tel"
              disabled={submitting}
              aria-invalid={!!errors.telefono}
              {...register("telefono")}
            />
            {errors.telefono && (
              <p className="text-xs text-destructive">{errors.telefono.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="t-correo" className="flex items-center gap-2 text-foreground font-medium">
              <Mail className="w-4 h-4 text-ciaf-blue" /> Correo
            </Label>
            <Input
              id="t-correo"
              type="email"
              placeholder="tucorreo@ejemplo.com"
              autoComplete="email"
              disabled={submitting}
              aria-invalid={!!errors.correo}
              {...register("correo")}
            />
            {errors.correo && (
              <p className="text-xs text-destructive">{errors.correo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="t-tipificacion" className="flex items-center gap-2 text-foreground font-medium">
              <Tag className="w-4 h-4 text-ciaf-blue" /> Tipificación
            </Label>
            <Select
              value={tipificacion ?? ""}
              onValueChange={(v) =>
                setValue("tipificacion", v as TurnoFormData["tipificacion"], {
                  shouldValidate: true,
                })
              }
              disabled={submitting}
            >
              <SelectTrigger id="t-tipificacion" aria-invalid={!!errors.tipificacion}>
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
                {TIPIFICACIONES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipificacion && (
              <p className="text-xs text-destructive">{errors.tipificacion.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="t-carrera" className="flex items-center gap-2 text-foreground font-medium">
              <GraduationCap className="w-4 h-4 text-ciaf-blue" /> Carrera
            </Label>
            <Select
              value={carrera ?? ""}
              onValueChange={(v) => setValue("carrera", v, { shouldValidate: true })}
              disabled={submitting}
            >
              <SelectTrigger id="t-carrera" aria-invalid={!!errors.carrera}>
                <SelectValue placeholder="Selecciona tu carrera" />
              </SelectTrigger>
              <SelectContent>
                {CARRERAS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.carrera && (
              <p className="text-xs text-destructive">{errors.carrera.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="t-semestre" className="flex items-center gap-2 text-foreground font-medium">
              <BookOpen className="w-4 h-4 text-ciaf-blue" /> Semestre
            </Label>
            <Select
              value={semestre ? String(semestre) : ""}
              onValueChange={(v) => setValue("semestre", Number(v), { shouldValidate: true })}
              disabled={submitting}
            >
              <SelectTrigger id="t-semestre" aria-invalid={!!errors.semestre}>
                <SelectValue placeholder="Selecciona tu semestre" />
              </SelectTrigger>
              <SelectContent>
                {semestresDisponibles.map((s) => (
                  <SelectItem key={s} value={String(s)}>{s}° semestre</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.semestre && (
              <p className="text-xs text-destructive">{errors.semestre.message as string}</p>
            )}
          </div>

          {carrera && semestre && (
            <div className="md:col-span-2 rounded-xl border border-ciaf-blue/20 bg-gradient-to-r from-ciaf-blue/5 to-ciaf-light-blue/10 p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-ciaf-blue text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] uppercase tracking-wider text-ciaf-blue/70 font-semibold">
                  Programa académico · Nivel {getNivelAcademico(semestre, carrera)}
                </p>
                <p className="text-sm font-semibold text-ciaf-blue leading-snug mt-0.5">
                  {getProgramaAcademico(carrera, semestre)}
                </p>
              </div>
            </div>
          )}

          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-ciaf-blue hover:bg-ciaf-blue/90 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Buscando asesora disponible…
                </>
              ) : (
                "Solicitar turno"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
    {virtualFallback && (
      <Dialog open onOpenChange={(o) => { if (!o) setVirtualFallback(null); }}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-ciaf-blue/10">
              <Globe className="h-6 w-6 text-ciaf-blue" />
            </div>
            <DialogTitle className="text-center">Atención presencial no disponible</DialogTitle>
            <DialogDescription className="text-center">
              Hemos activado tu asistente virtual para no detener tu proceso. Continúa con la simulación de crédito en línea.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="w-full bg-ciaf-blue hover:bg-ciaf-blue/90 text-white"
              onClick={() => {
                setModalidad("virtual");
                setVirtualFallback(null);
                navigate("/simulador");
              }}
            >
              Continuar virtual
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
};

export default TurnoForm;