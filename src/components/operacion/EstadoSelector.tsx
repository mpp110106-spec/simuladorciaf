import { motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ASESOR_ESTADO_DOT, ASESOR_ESTADO_LABEL, type AsesorEstado } from "@/types/asesora";

const ORDER: AsesorEstado[] = [
  "disponible", "ocupada", "en_llamada", "en_pausa", "almuerzo", "offline", "jornada_finalizada",
];

export default function EstadoSelector({
  value, onChange, disabled,
}: { value: AsesorEstado; onChange: (v: AsesorEstado) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="gap-2 h-10 px-3 bg-white/80 backdrop-blur border-white/40 shadow-sm"
        >
          <motion.span
            className={cn("w-2.5 h-2.5 rounded-full", ASESOR_ESTADO_DOT[value])}
            animate={value === "disponible" ? { scale: [1, 1.3, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.6 }}
          />
          <span className="font-medium text-slate-700">{ASESOR_ESTADO_LABEL[value]}</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1">
        {ORDER.map((e) => (
          <button
            key={e}
            onClick={() => { onChange(e); setOpen(false); }}
            className={cn(
              "w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm hover:bg-slate-100 transition-colors",
              value === e && "bg-slate-100",
            )}
          >
            <span className={cn("w-2 h-2 rounded-full", ASESOR_ESTADO_DOT[e])} />
            <span className="flex-1 text-left">{ASESOR_ESTADO_LABEL[e]}</span>
            {value === e && <Check className="w-4 h-4 text-emerald-600" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}