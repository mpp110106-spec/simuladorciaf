import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Loader2, CheckCircle2, User, Phone, Mail, Tag } from "lucide-react";
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
import { TIPIFICACIONES } from "@/lib/constants";
import { turnosService } from "@/services/turnosService";
import { useTracking } from "@/hooks/useTracking";

interface TurnoFormProps {
  simulacionValor?: number | null;
  onSuccess?: (turno: { id: string; numero: number }) => void;
}

const TurnoForm = ({ simulacionValor, onSuccess }: TurnoFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const { track } = useTracking();

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
    defaultValues: { nombre: "", telefono: "", correo: "", tipificacion: undefined as unknown as TurnoFormData["tipificacion"] },
  });

  const tipificacion = watch("tipificacion");

  const onSubmit = async (data: TurnoFormData) => {
    setSubmitting(true);
    try {
      const turno = await turnosService.create({
        nombre: data.nombre.trim(),
        telefono: data.telefono.trim(),
        correo: data.correo.trim(),
        tipificacion: data.tipificacion,
        simulacion_valor: simulacionValor ?? null,
      });
      track("turno_creado", { tipificacion: data.tipificacion, turno_id: turno.id });
      const numeroFmt = String(turno.numero ?? 0).padStart(3, "0");
      toast.success(`¡Turno ${numeroFmt} asignado!`, {
        description: "Guarda tu número de turno. Un asesor CIAF te contactará pronto.",
      });
      reset();
      if (onSuccess) {
        onSuccess({ id: turno.id, numero: turno.numero });
      } else {
        setDone(true);
      }
    } catch (e) {
      toast.error("No pudimos registrar tu turno", {
        description: e instanceof Error ? e.message : "Inténtalo nuevamente.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Card className="mt-6 border-ciaf-blue/20">
        <CardContent className="py-10 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-ciaf-blue-light flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-ciaf-blue" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Tu turno está registrado</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Un asesor CIAF te contactará pronto para continuar con el proceso. Gracias por confiar en
            nosotros.
          </p>
          <Button variant="outline" className="mt-2" onClick={() => setDone(false)}>
            Solicitar otro turno
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
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

          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-ciaf-blue hover:bg-ciaf-blue/90 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enviando…
                </>
              ) : (
                "Solicitar turno"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TurnoForm;