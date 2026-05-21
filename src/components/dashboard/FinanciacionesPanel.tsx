import { useEffect, useState, useCallback } from "react";
import { FileSignature, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { financiacionesService } from "@/services/financiacionesService";
import {
  FINANCIACION_ESTADOS,
  FINANCIACION_LABEL,
  type Financiacion,
  type FinanciacionEstado,
} from "@/types/financiacion";
import type { Turno } from "@/types/turno";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTimeCO } from "@/lib/formatters";

interface Props {
  turnos: Turno[];
}

const ESTADO_TONE: Record<FinanciacionEstado, string> = {
  pendiente: "bg-amber-100 text-amber-800 border-amber-200",
  en_revision: "bg-ciaf-blue-light text-ciaf-blue border-ciaf-blue/30",
  req_documentos: "bg-orange-100 text-orange-800 border-orange-200",
  aprobado: "bg-emerald-100 text-emerald-800 border-emerald-200",
  en_firma: "bg-indigo-100 text-indigo-800 border-indigo-200",
  finalizado: "bg-emerald-600 text-white border-emerald-600",
  rechazado: "bg-rose-100 text-rose-800 border-rose-200",
};

const FinanciacionesPanel = ({ turnos }: Props) => {
  const [items, setItems] = useState<Financiacion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("financiaciones")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error("No se pudieron cargar las financiaciones");
    } else {
      setItems((data ?? []) as Financiacion[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("financiaciones-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "financiaciones" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const turnoById = new Map(turnos.map((t) => [t.id, t]));

  const handleChange = async (id: string, estado: FinanciacionEstado) => {
    try {
      await financiacionesService.updateEstado(id, estado);
      toast.success("Estado actualizado");
    } catch {
      toast.error("No se pudo actualizar");
    }
  };

  const handleFirma = async (id: string) => {
    try {
      await financiacionesService.marcarFirma(id);
      toast.success("Firma registrada");
    } catch {
      toast.error("No se pudo registrar la firma");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base text-ciaf-blue flex items-center gap-2">
            <FileSignature className="w-4 h-4" /> Financiaciones · Estudios de crédito
          </CardTitle>
          <CardDescription>Gestiona el flujo de financiación y la firma del pagaré.</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading && items.length === 0 ? (
          <div className="py-10 flex items-center justify-center text-muted-foreground text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Aún no hay solicitudes de financiación.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Solicitud</TableHead>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cambiar estado</TableHead>
                  <TableHead>Firma</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((f) => {
                  const t = turnoById.get(f.turno_id);
                  return (
                    <TableRow key={f.id}>
                      <TableCell className="text-xs">
                        <div className="font-mono text-ciaf-blue">
                          {t ? `#${String(t.numero).padStart(3, "0")}` : f.id.slice(0, 6)}
                        </div>
                        <div className="text-muted-foreground">{formatDateTimeCO(f.created_at)}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium text-foreground">{t?.nombre ?? "—"}</div>
                        <div className="text-muted-foreground">{t?.telefono ?? ""}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`border ${ESTADO_TONE[f.estado]}`}>
                          {FINANCIACION_LABEL[f.estado]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={f.estado} onValueChange={(v) => handleChange(f.id, v as FinanciacionEstado)}>
                          <SelectTrigger className="h-8 text-xs w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FINANCIACION_ESTADOS.map((e) => (
                              <SelectItem key={e} value={e}>{FINANCIACION_LABEL[e]}</SelectItem>
                            ))}
                            <SelectItem value="rechazado">{FINANCIACION_LABEL.rechazado}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs">
                        {f.firmado ? (
                          <span className="text-emerald-700 font-medium">
                            ✓ Firmado {f.firma_fecha ? new Date(f.firma_fecha).toLocaleDateString("es-CO") : ""}
                          </span>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleFirma(f.id)}>
                            Registrar firma
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinanciacionesPanel;