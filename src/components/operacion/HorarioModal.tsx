import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { MiAsesora } from "@/types/asesora";

interface Props {
  open: boolean;
  asesora: MiAsesora | null;
  onClose: () => void;
  onSave: (patch: { hora_inicio: string; hora_fin: string; pausa_inicio: string | null; pausa_fin: string | null; max_capacidad: number }) => Promise<void>;
}

const t = (s?: string | null) => (s ? s.slice(0, 5) : "");

export default function HorarioModal({ open, asesora, onClose, onSave }: Props) {
  const [hi, setHi] = useState(""); const [hf, setHf] = useState("");
  const [pi, setPi] = useState(""); const [pf, setPf] = useState("");
  const [cap, setCap] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!asesora) return;
    setHi(t(asesora.hora_inicio)); setHf(t(asesora.hora_fin));
    setPi(t(asesora.pausa_inicio)); setPf(t(asesora.pausa_fin));
    setCap(asesora.max_capacidad);
  }, [asesora, open]);

  const handle = async () => {
    setLoading(true);
    try {
      await onSave({
        hora_inicio: hi, hora_fin: hf,
        pausa_inicio: pi || null, pausa_fin: pf || null,
        max_capacidad: cap,
      });
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-[#001550]">Configurar mi jornada</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Hora inicio</Label><Input type="time" value={hi} onChange={(e) => setHi(e.target.value)} /></div>
          <div><Label className="text-xs">Hora fin</Label><Input type="time" value={hf} onChange={(e) => setHf(e.target.value)} /></div>
          <div><Label className="text-xs">Pausa inicio</Label><Input type="time" value={pi} onChange={(e) => setPi(e.target.value)} /></div>
          <div><Label className="text-xs">Pausa fin</Label><Input type="time" value={pf} onChange={(e) => setPf(e.target.value)} /></div>
          <div className="col-span-2"><Label className="text-xs">Capacidad máxima simultánea</Label>
            <Input type="number" min={1} max={50} value={cap} onChange={(e) => setCap(Number(e.target.value))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handle} disabled={loading} className="bg-[#001550] hover:bg-[#013084] text-white">
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}