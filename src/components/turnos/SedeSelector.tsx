import { useEffect, useState } from "react";
import { Building2, MapPin, Check } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useFlow, type SedeCodigo } from "@/stores/flowStore";

interface Sede { id: string; codigo: string; nombre: string; }

const META: Record<string, { titulo: string; sub: string; icon: typeof Building2 }> = {
  CRAI:  { titulo: "Sede CRAI",  sub: "Edificio principal · Atención académica", icon: Building2 },
  SEXTA: { titulo: "Sede Sexta", sub: "Calle 6 · Atención comercial",            icon: MapPin },
};

const SedeSelector = () => {
  const { state, setSede } = useFlow();
  const [sedes, setSedes] = useState<Sede[]>([]);

  useEffect(() => {
    supabase.from("sedes").select("id, codigo, nombre").eq("activa", true).then(({ data }) => {
      setSedes((data ?? []) as Sede[]);
    });
  }, []);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground flex items-center gap-2">
        <Building2 className="w-4 h-4 text-ciaf-blue" /> Selecciona tu sede
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sedes.map((s) => {
          const meta = META[s.codigo] ?? { titulo: s.nombre, sub: "", icon: Building2 };
          const Icon = meta.icon;
          const selected = state.sedeCodigo === s.codigo;
          return (
            <motion.button
              key={s.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setSede(s.codigo as SedeCodigo, s.id)}
              className={`relative text-left rounded-2xl border p-4 transition-all overflow-hidden ${
                selected
                  ? "border-ciaf-blue bg-gradient-to-br from-ciaf-blue to-ciaf-light-blue text-white shadow-lg"
                  : "border-ciaf-blue/20 bg-white hover:border-ciaf-blue/50 hover:shadow-md"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  selected ? "bg-white/20 ring-1 ring-white/30" : "bg-ciaf-blue/10"
                }`}>
                  <Icon className={`w-5 h-5 ${selected ? "text-white" : "text-ciaf-blue"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${selected ? "text-white" : "text-ciaf-blue"}`}>{meta.titulo}</p>
                  <p className={`text-xs mt-0.5 ${selected ? "text-white/85" : "text-muted-foreground"}`}>{meta.sub}</p>
                </div>
                {selected && (
                  <div className="w-6 h-6 rounded-full bg-white text-ciaf-blue flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SedeSelector;