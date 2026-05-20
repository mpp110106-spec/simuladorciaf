import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { ESTADOS, ESTADO_BADGE, ESTADO_LABEL, PRIORIDAD_BADGE, PRIORIDAD_LABEL, TIPIFICACIONES } from "@/lib/constants";
import type { Turno, TurnoEstado, TurnoPrioridad } from "@/types/turno";
import { formatCurrencyCO, formatDateTimeCO, formatDateCO } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface Props {
  turnos: Turno[];
  loading: boolean;
  onChangeEstado: (id: string, estado: TurnoEstado) => Promise<void>;
}

const PAGE_SIZE = 10;

const TurnosTable = ({ turnos, loading, onChangeEstado }: Props) => {
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");
  const [tipFilter, setTipFilter] = useState<string>("todos");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return turnos.filter((t) => {
      if (estadoFilter !== "todos" && t.estado !== estadoFilter) return false;
      if (tipFilter !== "todos" && t.tipificacion !== tipFilter) return false;
      if (!q) return true;
      return [t.nombre, t.correo ?? "", t.telefono, t.carrera ?? "", String(t.numero ?? "")]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [turnos, search, estadoFilter, tipFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const groupedByDay = useMemo(() => {
    const groups = new Map<string, Turno[]>();
    for (const t of pageRows) {
      const key = t.turno_fecha ?? (t.created_at ? t.created_at.slice(0, 10) : "—");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    return Array.from(groups.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [pageRows]);

  const handleEstadoChange = async (id: string, estado: TurnoEstado) => {
    try {
      await onChangeEstado(id, estado);
      toast.success("Estado actualizado");
    } catch {
      toast.error("No se pudo actualizar el estado");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-ciaf-blue">Turnos registrados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre, correo o teléfono"
              className="pl-9"
            />
          </div>
          <Select value={estadoFilter} onValueChange={(v) => { setEstadoFilter(v); setPage(1); }}>
            <SelectTrigger className="md:w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {ESTADOS.map((e) => <SelectItem key={e} value={e}>{ESTADO_LABEL[e]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tipFilter} onValueChange={(v) => { setTipFilter(v); setPage(1); }}>
            <SelectTrigger className="md:w-44"><SelectValue placeholder="Tipificación" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las tipificaciones</SelectItem>
              {TIPIFICACIONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No hay turnos para mostrar.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              {groupedByDay.map(([fecha, rows]) => (
                <div key={fecha} className="mb-6">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <h3 className="text-sm font-semibold text-ciaf-blue">
                      {fecha === "—" ? "Sin fecha" : formatDateCO(fecha)}
                    </h3>
                    <span className="text-xs text-muted-foreground">{rows.length} turno{rows.length === 1 ? "" : "s"}</span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Turno</TableHead>
                        <TableHead>Estudiante</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Carrera / Semestre</TableHead>
                        <TableHead>Tipificación</TableHead>
                        <TableHead>Prioridad</TableHead>
                        <TableHead>Simulación</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-mono font-semibold text-ciaf-blue">
                            #{String(t.numero ?? 0).padStart(3, "0")}
                          </TableCell>
                          <TableCell className="font-medium">{t.nombre}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <div>{t.telefono}</div>
                            <div>{t.correo}</div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="font-medium text-foreground">{t.carrera ?? "—"}</div>
                            <div className="text-muted-foreground">{t.semestre ? `${t.semestre}° semestre` : ""}</div>
                          </TableCell>
                          <TableCell>{t.tipificacion}</TableCell>
                          <TableCell>
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs border", PRIORIDAD_BADGE[t.prioridad as TurnoPrioridad] ?? "")}>
                              {PRIORIDAD_LABEL[t.prioridad as TurnoPrioridad] ?? t.prioridad}
                            </span>
                          </TableCell>
                          <TableCell>{formatCurrencyCO(t.simulacion_valor ?? null)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDateTimeCO(t.created_at)}</TableCell>
                          <TableCell>
                            <Select
                              value={t.estado}
                              onValueChange={(v) => handleEstadoChange(t.id, v as TurnoEstado)}
                            >
                              <SelectTrigger className={cn("h-8 text-xs border", ESTADO_BADGE[t.estado as TurnoEstado] ?? "")}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ESTADOS.map((e) => <SelectItem key={e} value={e}>{ESTADO_LABEL[e]}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <span>{filtered.length} resultados</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <span>Pág. {safePage} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TurnosTable;