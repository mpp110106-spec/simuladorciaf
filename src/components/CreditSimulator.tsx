import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTracking, usePageView } from "@/hooks/useTracking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import logoCiaf from "@/assets/logo-ciaf-azul.png";
import qrDaviplata from "@/assets/qr-daviplata-ciaf.png";
import { 
  Calculator, 
  BookOpen, 
  DollarSign, 
  CreditCard, 
  CheckCircle2, 
  GraduationCap, 
  MessageCircle, 
  Wallet, 
  Mail, 
  Banknote, 
  Calendar, 
  Shield,
  Key,
  FileText,
  QrCode,
  Percent,
  Clock,
  ArrowRight,
  Sun,
  Moon,
  CalendarDays,
  Info,
  FileSignature,
  ExternalLink
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

// Tipos de Jornada
type TipoJornada = "Diurna" | "Nocturna" | "Sabatina" | "Fines de semana";
const JORNADAS: TipoJornada[] = ["Diurna", "Nocturna", "Sabatina", "Fines de semana"];

// Mapa de precios con Ordinaria y Extraordinaria 2026-I
interface PrecioMatricula {
  ordinaria: number;
  extraordinaria: number;
}

const PRECIOS_MATRICULA_2026: Record<string, Record<number, PrecioMatricula>> = {
  // ADMINISTRACIÓN
  "Técnico Profesional en Procesos Empresariales": {
    1: { ordinaria: 2512000, extraordinaria: 2889000 },
    2: { ordinaria: 2512000, extraordinaria: 2889000 },
    3: { ordinaria: 2512000, extraordinaria: 2889000 },
    4: { ordinaria: 2512000, extraordinaria: 2889000 }
  },
  "Tecnología en Gestión y Auditoría Administrativa": {
    5: { ordinaria: 2628000, extraordinaria: 3022000 },
    6: { ordinaria: 2628000, extraordinaria: 3022000 },
    7: { ordinaria: 2628000, extraordinaria: 3022000 }
  },
  "Profesional en Administración de Empresas": {
    8: { ordinaria: 3223000, extraordinaria: 3706000 },
    9: { ordinaria: 3223000, extraordinaria: 3706000 },
    10: { ordinaria: 3223000, extraordinaria: 3706000 }
  },
  // CONTADURÍA PÚBLICA
  "Técnico Profesional en Operaciones Contables y Financieras": {
    1: { ordinaria: 2129000, extraordinaria: 2448000 },
    2: { ordinaria: 2129000, extraordinaria: 2448000 },
    3: { ordinaria: 2129000, extraordinaria: 2448000 },
    4: { ordinaria: 2129000, extraordinaria: 2448000 }
  },
  "Tecnología en Gestión Contable INTEP 2025": {
    5: { ordinaria: 2705000, extraordinaria: 3111000 },
    6: { ordinaria: 2705000, extraordinaria: 3111000 },
    7: { ordinaria: 2705000, extraordinaria: 3111000 }
  },
  "Profesional en Contaduría Pública INTEP 2021": {
    8: { ordinaria: 3349000, extraordinaria: 3851000 },
    9: { ordinaria: 3349000, extraordinaria: 3851000 },
    10: { ordinaria: 3349000, extraordinaria: 3851000 }
  },
  // SST
  "Técnico Profesional en Procesos de Seguridad y Salud en el Trabajo": {
    1: { ordinaria: 2640000, extraordinaria: 3036000 },
    2: { ordinaria: 2640000, extraordinaria: 3036000 },
    3: { ordinaria: 2640000, extraordinaria: 3036000 },
    4: { ordinaria: 2640000, extraordinaria: 3036000 }
  },
  "Tecnología en Gestión de la Seguridad y Salud en el Trabajo": {
    5: { ordinaria: 2937000, extraordinaria: 3378000 },
    6: { ordinaria: 2937000, extraordinaria: 3378000 }
  },
  "Profesional en Seguridad y Salud en el Trabajo": {
    7: { ordinaria: 3223000, extraordinaria: 3706000 },
    8: { ordinaria: 3223000, extraordinaria: 3706000 },
    9: { ordinaria: 3223000, extraordinaria: 3706000 },
    10: { ordinaria: 3223000, extraordinaria: 3706000 }
  },
  // SOFTWARE
  "Técnica Profesional en Programación de Software": {
    1: { ordinaria: 2640000, extraordinaria: 3036000 },
    2: { ordinaria: 2640000, extraordinaria: 3036000 },
    3: { ordinaria: 2640000, extraordinaria: 3036000 },
    4: { ordinaria: 2640000, extraordinaria: 3036000 }
  },
  "Tecnología en Desarrollo de Software": {
    5: { ordinaria: 3014000, extraordinaria: 3466000 },
    6: { ordinaria: 3014000, extraordinaria: 3466000 },
    7: { ordinaria: 3014000, extraordinaria: 3466000 }
  },
  "Profesional en Ingeniería de Software": {
    8: { ordinaria: 3561000, extraordinaria: 4095000 },
    9: { ordinaria: 3561000, extraordinaria: 4095000 },
    10: { ordinaria: 3561000, extraordinaria: 4095000 }
  },
  // INDUSTRIAL
  "Técnico Profesional en Logística de Producción": {
    1: { ordinaria: 2654000, extraordinaria: 3052000 },
    2: { ordinaria: 2654000, extraordinaria: 3052000 },
    3: { ordinaria: 2654000, extraordinaria: 3052000 },
    4: { ordinaria: 2654000, extraordinaria: 3052000 }
  },
  "Tecnología en Gestión Industrial": {
    5: { ordinaria: 3227000, extraordinaria: 3711000 },
    6: { ordinaria: 3227000, extraordinaria: 3711000 },
    7: { ordinaria: 3227000, extraordinaria: 3711000 }
  },
  "Profesional en Ingeniería Industrial": {
    8: { ordinaria: 3540000, extraordinaria: 4071000 },
    9: { ordinaria: 3540000, extraordinaria: 4071000 },
    10: { ordinaria: 3540000, extraordinaria: 4071000 }
  },
  // ENFERMERÍA
  "Técnico Laboral por Competencias en Auxiliar en Enfermería": {
    1: { ordinaria: 2365000, extraordinaria: 2720000 },
    2: { ordinaria: 2365000, extraordinaria: 2720000 },
    3: { ordinaria: 2365000, extraordinaria: 2720000 }
  },
  // VETERINARIA
  "Técnico Laboral por Competencias en Auxiliar de Veterinaria": {
    1: { ordinaria: 2400000, extraordinaria: 2760000 },
    2: { ordinaria: 2400000, extraordinaria: 2760000 }
  },
  // MOTOS
  "Técnico Laboral en Mecánica y Mantenimiento de Motocicletas": {
    1: { ordinaria: 2224000, extraordinaria: 2558000 },
    2: { ordinaria: 2224000, extraordinaria: 2558000 }
  },
  // ADMINISTRATIVO EN SALUD
  "Técnico Laboral por Competencias en Administrativo en Salud": {
    1: { ordinaria: 1863000, extraordinaria: 2142000 },
    2: { ordinaria: 1863000, extraordinaria: 2142000 },
    3: { ordinaria: 1863000, extraordinaria: 2142000 }
  }
};

const PROGRAMAS_ACADEMICOS = Object.keys(PRECIOS_MATRICULA_2026).sort();

const getSemestresDisponibles = (programa: string): number[] => {
  if (!programa || !PRECIOS_MATRICULA_2026[programa]) return [];
  return Object.keys(PRECIOS_MATRICULA_2026[programa]).map(Number).sort((a, b) => a - b);
};

// Fechas de matrícula 2026-I (zona horaria Colombia)
// Ordinaria
//   Diurna y Nocturna: 15/06/2026 - 25/07/2026
//   Sabatina y Fines de semana: 04/07/2026 - 25/07/2026
//   (pagos antes de estas fechas también se consideran ordinaria)
// Extraordinaria
//   Diurna y Nocturna: 26/07/2026 - 08/08/2026
//   Sabatina y Fines de semana: 26/07/2026 - 01/08/2026
const FECHA_LIMITE_ORDINARIA = new Date("2026-07-25T23:59:59-05:00");

const esTipoExtraordinaria = (_jornada: TipoJornada, hoy: Date = new Date()): boolean => {
  return hoy.getTime() > FECHA_LIMITE_ORDINARIA.getTime();
};

// Función que retorna el precio correcto según la jornada y la fecha actual
const getPrecioMatricula = (programa: string, semestre: number, jornada: TipoJornada): number | null => {
  if (!programa || !PRECIOS_MATRICULA_2026[programa]) return null;
  const precios = PRECIOS_MATRICULA_2026[programa][semestre];
  if (!precios) return null;
  return esTipoExtraordinaria(jornada) ? precios.extraordinaria : precios.ordinaria;
};

const esJornadaOrdinaria = (jornada: TipoJornada): boolean => {
  return !esTipoExtraordinaria(jornada);
};

const PORCENTAJES_CUOTA_INICIAL = [20, 30, 40, 50];
const OPCIONES_CUOTAS = [4, 5, 6];

const ESTUDIO_CREDITO = 48000;
const SEGURO_ESTUDIANTIL = 14860;

const POPUP_TIMEOUT = 10000;
const FINANCING_DECISION_KEY = "ciaf_financing_decision";

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
};

const parseInputValue = (value: string): number => {
  const cleaned = value.replace(/[^\d]/g, "");
  return parseInt(cleaned, 10) || 0;
};

interface ResultadosSimulacion {
  programa: string;
  semestre: number;
  valorTotal: number;
  cuotaInicialBase: number;
  estudioCredito: number;
  seguroEstudiantil: number;
  cuotaInicialTotal: number;
  porcentajeCuotaInicial: number;
  montoFinanciar: number;
  cantidadCuotas: number;
  valorPorCuota: number;
}

interface FieldErrors {
  programa?: string;
  semestre?: string;
  jornada?: string;
  valorTotal?: string;
  cuotaInicial?: string;
}

interface InfoCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
  priority?: "high" | "medium" | "normal";
  children?: React.ReactNode;
}

// Componente: Caja de Información Profesional
const InfoCard = ({ 
  icon: Icon, 
  label, 
  value, 
  description, 
  priority = "normal",
  children 
}: InfoCardProps) => {
  const priorityStyles = {
    high: "bg-ciaf-blue-light border-ciaf-blue",
    medium: "bg-ciaf-blue-light border-ciaf-blue/60",
    normal: "bg-muted/30 border-border"
  };

  const valueStyles = {
    high: "text-[28px] sm:text-[32px]",
    medium: "text-[24px] sm:text-[28px]",
    normal: "text-xl"
  };

  return (
    <div className={`
      rounded-xl border-2 p-5 sm:p-6 transition-all duration-200
      hover:shadow-lg hover:-translate-y-0.5
      ${priorityStyles[priority]}
    `}>
      <div className="flex items-center justify-center gap-2 text-ciaf-blue mb-3">
        <Icon className="w-5 h-5" strokeWidth={2} />
        <span className="text-sm font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={`font-bold text-ciaf-blue text-center ${valueStyles[priority]}`}>
        {value}
      </p>
      <p className="text-sm text-ciaf-blue/70 text-center mt-2 flex items-center justify-center gap-2">
        <FileText className="w-4 h-4" />
        {description}
      </p>
      {children}
    </div>
  );
};

// Componente: Caja de Pago de Contado
const CashPaymentBox = ({ 
  valorMatricula,
  onClose 
}: { 
  valorMatricula: number;
  onClose: () => void;
}) => {
  const valorConDescuento = Math.round(valorMatricula * 0.90);
  const ahorro = valorMatricula - valorConDescuento;

  return (
    <div className="bg-ciaf-blue-light border-2 border-ciaf-blue rounded-xl p-5 sm:p-6 animate-scale-in">
      {/* Header con botón cerrar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-ciaf-blue">
          <Percent className="w-5 h-5" strokeWidth={2} />
          <span className="text-sm font-semibold uppercase tracking-wide">Pago de Contado</span>
        </div>
        <button 
          onClick={onClose}
          className="text-ciaf-blue/50 hover:text-ciaf-blue transition-colors p-1"
          aria-label="Volver a financiación"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Mensaje principal */}
      <div className="bg-white/80 rounded-lg p-3 mb-4 border border-ciaf-blue/10">
        <div className="flex items-center gap-2 text-ciaf-blue font-semibold text-sm mb-1">
          <CheckCircle2 className="w-4 h-4" />
          ¡Excelente! El pago de contado aplica solo hasta el 15 de enero.
        </div>
        <p className="text-xs text-ciaf-blue/70">
          El valor de contado corresponde a la matrícula menos el 10% de descuento.
        </p>
      </div>

      {/* Valor con descuento */}
      <div className="text-center mb-4">
        <p className="text-xs text-ciaf-blue/70 mb-1 flex items-center justify-center gap-1">
          <Wallet className="w-3 h-3" />
          Valor a pagar con descuento
        </p>
        <p className="text-[32px] sm:text-[36px] font-bold text-ciaf-blue">
          {formatCurrency(valorConDescuento)}
        </p>
        <p className="text-xs text-ciaf-blue/60 mt-1">
          Ahorras {formatCurrency(ahorro)} (10% de descuento)
        </p>
      </div>

      {/* Fecha límite */}
      <div className="flex items-center justify-center gap-2 bg-white/60 rounded-lg p-2 mb-4 border border-ciaf-blue/10">
        <Clock className="w-4 h-4 text-ciaf-blue" />
        <span className="text-sm text-ciaf-blue font-medium">Válido hasta: 15 de enero de 2026</span>
      </div>

      {/* Medios de pago */}
      <div className="space-y-3">
        <p className="text-xs text-ciaf-blue font-semibold text-center uppercase tracking-wide">
          Medios de Pago
        </p>

        {/* QR y Llave */}
        <div className="grid grid-cols-2 gap-3">
          {/* QR Code */}
          <div className="bg-white rounded-lg p-3 border border-border flex flex-col items-center">
            <div className="flex items-center gap-1 text-xs text-ciaf-blue font-medium mb-2">
              <QrCode className="w-3 h-3" />
              Código QR
            </div>
            <img 
              src={qrDaviplata} 
              alt="Código QR Daviplata CIAF" 
              className="w-full max-w-[100px] h-auto rounded"
            />
          </div>

          {/* Llave Daviplata */}
          <div className="bg-white rounded-lg p-3 border border-border flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-xs text-ciaf-blue font-medium mb-2">
              <Key className="w-3 h-3" />
              Llave Daviplata
            </div>
            <p className="text-lg font-mono font-bold text-ciaf-blue">@daviciaf</p>
            <p className="text-[10px] text-muted-foreground mt-1">Pago directo</p>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-lg p-3 border border-border space-y-2">
          <a 
            href="https://wa.me/573126814341" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-ciaf-blue font-medium hover:underline transition-all text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp: 312 681 4341
          </a>
          <a 
            href="mailto:pagos@ciaf.edu.co"
            className="flex items-center justify-center gap-2 text-ciaf-blue font-medium hover:underline transition-all text-sm"
          >
            <Mail className="w-4 h-4" />
            pagos@ciaf.edu.co
          </a>
        </div>

        {/* Instrucción final */}
        <p className="text-xs text-center text-ciaf-blue/70 bg-white/60 rounded-lg p-2 border border-ciaf-blue/10">
          Para confirmar tu pago, utiliza cualquiera de nuestros medios y envía tu comprobante a <strong>pagos@ciaf.edu.co</strong>
        </p>
      </div>
    </div>
  );
};

// Componente: Barra Sticky Inferior
const StickyFinancingBar = ({ 
  visible,
  onSelectFinancing,
  onSelectCash
}: { 
  visible: boolean;
  onSelectFinancing: () => void;
  onSelectCash: () => void;
}) => {
  if (!visible) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 animate-in slide-in-from-bottom duration-300"
      style={{ boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.08)" }}
    >
      <div className="max-w-2xl mx-auto px-4 py-4">
        <p className="text-center text-sm text-muted-foreground mb-2">
          Aún puedes elegir tu forma de pago
        </p>
        <p className="text-center font-medium text-foreground mb-3">¿Deseas financiar?</p>
        <div className="flex gap-3">
          <Button 
            onClick={onSelectFinancing}
            className="flex-1 h-12 bg-ciaf-blue hover:bg-ciaf-blue-hover text-white transition-all hover:shadow-md"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Sí, quiero financiar
          </Button>
          <Button 
            onClick={onSelectCash}
            variant="outline"
            className="flex-1 h-12 border-border hover:bg-muted/50 transition-all"
          >
            <Banknote className="w-4 h-4 mr-2" />
            No, pagaré de contado
          </Button>
        </div>
      </div>
    </div>
  );
};

const CreditSimulator = () => {
  usePageView("visita_app");
  const { track } = useTracking();
  const navigate = useNavigate();
  const [programa, setPrograma] = useState<string>("");
  const [semestre, setSemestre] = useState<string>("");
  const [jornada, setJornada] = useState<TipoJornada | "">("");
  const [valorTotal, setValorTotal] = useState<string>("");
  const [tipoCuotaInicial, setTipoCuotaInicial] = useState<"porcentaje" | "monto">("porcentaje");
  const [porcentajeCuotaInicial, setPorcentajeCuotaInicial] = useState<string>("20");
  const [montoCuotaInicial, setMontoCuotaInicial] = useState<string>("");
  const [cantidadCuotas, setCantidadCuotas] = useState<string>("4");
  const [resultados, setResultados] = useState<ResultadosSimulacion | null>(null);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  
  const [financingPromptVisible, setFinancingPromptVisible] = useState(false);
  const [financingDismissed, setFinancingDismissed] = useState(false);
  const [stickyFinancingVisible, setStickyFinancingVisible] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [showCashPayment, setShowCashPayment] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const savedDecision = localStorage.getItem(FINANCING_DECISION_KEY);
    if (savedDecision === "no") {
      setFinancingDismissed(true);
    }
  }, []);

  useEffect(() => {
    if (mostrarResultados && resultados && !financingDismissed && !financingPromptVisible && !stickyFinancingVisible) {
      timerRef.current = setTimeout(() => {
        setFinancingPromptVisible(true);
      }, 3000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [mostrarResultados, resultados, financingDismissed, financingPromptVisible, stickyFinancingVisible]);

  useEffect(() => {
    if (financingPromptVisible) {
      popupTimerRef.current = setTimeout(() => {
        setFinancingPromptVisible(false);
        setStickyFinancingVisible(true);
      }, POPUP_TIMEOUT);
    }

    return () => {
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
      }
    };
  }, [financingPromptVisible]);

  const semestresDisponibles = useMemo(() => getSemestresDisponibles(programa), [programa]);

  const handleProgramaChange = (nuevoPrograma: string) => {
    setPrograma(nuevoPrograma);
    setSemestre("");
    setJornada("");
    setValorTotal("");
  };

  const handleSemestreChange = (nuevoSemestre: string) => {
    setSemestre(nuevoSemestre);
    // El precio se actualizará cuando se seleccione la jornada
    if (jornada) {
      const precio = getPrecioMatricula(programa, parseInt(nuevoSemestre, 10), jornada as TipoJornada);
      if (precio) {
        setValorTotal(precio.toString());
      }
    }
  };

  const handleJornadaChange = (nuevaJornada: TipoJornada) => {
    setJornada(nuevaJornada);
    if (programa && semestre) {
      const precio = getPrecioMatricula(programa, parseInt(semestre, 10), nuevaJornada);
      if (precio) {
        setValorTotal(precio.toString());
      }
    }
  };

  const porcentajeReal = useMemo(() => {
    const total = parseInputValue(valorTotal);
    if (total === 0) return 0;

    if (tipoCuotaInicial === "porcentaje") {
      return parseInt(porcentajeCuotaInicial, 10);
    } else {
      const monto = parseInputValue(montoCuotaInicial);
      return (monto / total) * 100;
    }
  }, [valorTotal, tipoCuotaInicial, porcentajeCuotaInicial, montoCuotaInicial]);

  // Validación en vivo — solo se muestra después de un primer intento o cuando el campo tiene valor
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = useMemo<FieldErrors>(() => {
    const e: FieldErrors = {};
    if (!programa) e.programa = "Selecciona un programa académico.";
    if (programa && !semestre) e.semestre = "Selecciona un semestre.";
    if (semestre && !jornada) e.jornada = "Selecciona una jornada.";
    const total = parseInputValue(valorTotal);
    if (valorTotal && total <= 0) e.valorTotal = "Ingresa un valor numérico mayor a 0.";
    if (valorTotal && total > 0 && total < 100000) e.valorTotal = "El valor parece demasiado bajo. Revisa el monto.";
    if (total > 0) {
      if (tipoCuotaInicial === "monto") {
        const monto = parseInputValue(montoCuotaInicial);
        if (montoCuotaInicial && monto <= 0) e.cuotaInicial = "Ingresa un monto válido para la cuota inicial.";
        else if (montoCuotaInicial && (monto / total) * 100 < 20)
          e.cuotaInicial = `Mínimo ${formatCurrency(Math.ceil(total * 0.2))} (20% del valor).`;
        else if (montoCuotaInicial && monto > total)
          e.cuotaInicial = "La cuota inicial no puede superar el valor total.";
      } else {
        const pct = parseInt(porcentajeCuotaInicial, 10);
        if (pct < 20) e.cuotaInicial = "El porcentaje mínimo es 20%.";
        else if (pct > 100) e.cuotaInicial = "El porcentaje máximo es 100%.";
      }
    }
    return e;
  }, [programa, semestre, jornada, valorTotal, tipoCuotaInicial, montoCuotaInicial, porcentajeCuotaInicial]);

  const showErr = (key: keyof FieldErrors): string | undefined => {
    if (!errors[key]) return undefined;
    if (submitAttempted) return errors[key];
    // Mostrar inline si el campo ya tiene contenido ingresado
    if (key === "valorTotal" && valorTotal) return errors[key];
    if (key === "cuotaInicial" && (montoCuotaInicial || tipoCuotaInicial === "porcentaje")) return errors[key];
    return undefined;
  };

  const validarFormulario = useCallback((): boolean => {
    setSubmitAttempted(true);
    const firstError = errors.programa ?? errors.semestre ?? errors.jornada ?? errors.valorTotal ?? errors.cuotaInicial;
    if (firstError) {
      toast.error(firstError);
      return false;
    }
    if (parseInputValue(valorTotal) <= 0) {
      toast.error("Ingresa el valor de la matrícula.");
      return false;
    }
    return true;
  }, [errors, valorTotal]);

  const calcularSimulacion = useCallback(() => {
    if (!validarFormulario()) return;

    const total = parseInputValue(valorTotal);
    const semestreNum = parseInt(semestre, 10);
    let cuotaInicialBase: number;

    if (tipoCuotaInicial === "porcentaje") {
      cuotaInicialBase = (total * parseInt(porcentajeCuotaInicial, 10)) / 100;
    } else {
      cuotaInicialBase = parseInputValue(montoCuotaInicial);
    }

    const esSestreImpar = semestreNum % 2 !== 0;
    const seguroAplicable = esSestreImpar ? SEGURO_ESTUDIANTIL : 0;

    const cuotaInicialTotal = cuotaInicialBase + ESTUDIO_CREDITO + seguroAplicable;
    const montoFinanciar = total - cuotaInicialBase;
    const numCuotas = parseInt(cantidadCuotas, 10);
    const valorPorCuota = montoFinanciar / numCuotas;

    const resultado: ResultadosSimulacion = {
      programa,
      semestre: semestreNum,
      valorTotal: total,
      cuotaInicialBase: Math.round(cuotaInicialBase),
      estudioCredito: ESTUDIO_CREDITO,
      seguroEstudiantil: seguroAplicable,
      cuotaInicialTotal: Math.round(cuotaInicialTotal),
      porcentajeCuotaInicial: Math.round(porcentajeReal * 100) / 100,
      montoFinanciar: Math.round(montoFinanciar),
      cantidadCuotas: numCuotas,
      valorPorCuota: Math.round(valorPorCuota),
    };

    setResultados(resultado);
    setMostrarResultados(true);
    track("simulacion_realizada", {
      programa: resultado.programa,
      semestre: resultado.semestre,
      valor_total: resultado.valorTotal,
      cantidad_cuotas: resultado.cantidadCuotas,
    });
    toast.success("Simulación calculada correctamente");
  }, [programa, semestre, valorTotal, tipoCuotaInicial, porcentajeCuotaInicial, montoCuotaInicial, cantidadCuotas, porcentajeReal, validarFormulario]);

  const limpiarFormulario = () => {
    setPrograma("");
    setSemestre("");
    setJornada("");
    setValorTotal("");
    setTipoCuotaInicial("porcentaje");
    setPorcentajeCuotaInicial("20");
    setMontoCuotaInicial("");
    setCantidadCuotas("4");
    setResultados(null);
    setMostrarResultados(false);
    setFinancingPromptVisible(false);
    setStickyFinancingVisible(false);
    setPaymentModalOpen(false);
    setShowCashPayment(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
  };

  const handleFinancingDialogClose = (open: boolean) => {
    if (!open) {
      setFinancingPromptVisible(false);
      setStickyFinancingVisible(true);
    }
  };

  const handleSelectFinancing = () => {
    setFinancingPromptVisible(false);
    setStickyFinancingVisible(false);
    setFinancingDismissed(true);
    setShowCashPayment(false);
    localStorage.setItem(FINANCING_DECISION_KEY, "yes");
    navigate("/financiacion");
  };

  const handleSelectCash = () => {
    setFinancingPromptVisible(false);
    setStickyFinancingVisible(false);
    setFinancingDismissed(true);
    setShowCashPayment(true);
    localStorage.setItem(FINANCING_DECISION_KEY, "no");
  };

  const handleCloseCashPayment = () => {
    setShowCashPayment(false);
    setFinancingDismissed(false);
    localStorage.removeItem(FINANCING_DECISION_KEY);
  };

  const handlePayInitialQuota = () => {
    navigate("/financiacion");
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10 animate-fade-in">
          <div className="flex flex-col items-center gap-4 mb-6">
            <img 
              src={logoCiaf} 
              alt="Logo CIAF - Centro de Instrucción y Aprendizaje Financiero" 
              className="h-16 sm:h-20 w-auto object-contain"
            />
            <div className="h-1 w-24 bg-ciaf-blue rounded-full" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-ciaf-blue mb-3">
            Simulador de Créditos
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Calcula el valor de tu matrícula, cuota inicial y plan de pagos de forma rápida y sencilla
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Formulario */}
          <Card className="shadow-lg border border-border/50 animate-slide-up bg-card" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl text-ciaf-blue">
                <Calculator className="w-5 h-5" strokeWidth={2} />
                Información del Crédito
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Programa Académico */}
              <div className="space-y-2">
                <Label htmlFor="programa" className="flex items-center gap-2 text-foreground font-medium">
                  <BookOpen className="w-4 h-4 text-ciaf-blue" strokeWidth={2} />
                  Programa Académico
                </Label>
                <Select value={programa} onValueChange={handleProgramaChange}>
                  <SelectTrigger id="programa" aria-invalid={!!(submitAttempted && errors.programa)} className={`h-12 bg-card border-input hover:border-ciaf-blue transition-colors ${submitAttempted && errors.programa ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Seleccione su programa" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80 bg-popover border-border z-50">
                    {PROGRAMAS_ACADEMICOS.map((prog) => (
                      <SelectItem key={prog} value={prog} className="cursor-pointer hover:bg-muted">
                        {prog}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {submitAttempted && errors.programa && (
                  <p role="alert" className="text-sm text-destructive font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" /> {errors.programa}
                  </p>
                )}
              </div>

              {/* Semestre */}
              <div className="space-y-2">
                <Label htmlFor="semestre" className="flex items-center gap-2 text-foreground font-medium">
                  <GraduationCap className="w-4 h-4 text-ciaf-blue" strokeWidth={2} />
                  Semestre
                </Label>
                <Select 
                  value={semestre} 
                  onValueChange={handleSemestreChange}
                  disabled={!programa}
                >
                  <SelectTrigger id="semestre" aria-invalid={!!(submitAttempted && errors.semestre)} className={`h-12 bg-card border-input hover:border-ciaf-blue transition-colors ${submitAttempted && errors.semestre ? "border-destructive" : ""}`}>
                    <SelectValue placeholder={programa ? "Seleccione el semestre" : "Primero seleccione un programa"} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    {semestresDisponibles.map((sem) => (
                      <SelectItem key={sem} value={sem.toString()} className="cursor-pointer hover:bg-muted">
                        Semestre {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {submitAttempted && errors.semestre && (
                  <p role="alert" className="text-sm text-destructive font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" /> {errors.semestre}
                  </p>
                )}
              </div>

              {/* Jornada */}
              <div className="space-y-2">
                <Label htmlFor="jornada" className="flex items-center gap-2 text-foreground font-medium">
                  <Sun className="w-4 h-4 text-ciaf-blue" strokeWidth={2} />
                  Jornada
                </Label>
                <Select 
                  value={jornada} 
                  onValueChange={(value) => handleJornadaChange(value as TipoJornada)}
                  disabled={!semestre}
                >
                  <SelectTrigger id="jornada" className="h-12 bg-card border-input hover:border-ciaf-blue transition-colors">
                    <SelectValue placeholder={semestre ? "Seleccione la jornada" : "Primero seleccione un semestre"} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    {JORNADAS.map((j) => (
                      <SelectItem key={j} value={j} className="cursor-pointer hover:bg-muted">
                        <span className="flex items-center gap-2">
                          {j === "Diurna" && <Sun className="w-4 h-4" />}
                          {j === "Nocturna" && <Moon className="w-4 h-4" />}
                          {j === "Sabatina" && <CalendarDays className="w-4 h-4" />}
                          {j === "Fines de semana" && <CalendarDays className="w-4 h-4" />}
                          {j}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Mensaje informativo para jornadas ordinarias */}
                {jornada && esJornadaOrdinaria(jornada as TipoJornada) && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold">Información importante</p>
                      <p className="text-amber-700">El valor mostrado corresponde a matrícula ordinaria.</p>
                    </div>
                  </div>
                )}
                {showErr("jornada") && (
                  <p id="jornada-error" role="alert" className="text-sm text-destructive font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" /> {showErr("jornada")}
                  </p>
                )}
              </div>

              {/* Valor Total */}
              <div className="space-y-2">
                <Label htmlFor="valorTotal" className="flex items-center gap-2 text-foreground font-medium">
                  <DollarSign className="w-4 h-4 text-ciaf-blue" strokeWidth={2} />
                  Valor Total de la Matrícula
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <Input
                    id="valorTotal"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={valorTotal ? formatCurrency(parseInputValue(valorTotal)).replace("$", "").trim() : ""}
                    onChange={(e) => setValorTotal(e.target.value)}
                    aria-invalid={!!showErr("valorTotal")}
                    aria-describedby={showErr("valorTotal") ? "valorTotal-error" : undefined}
                    className={`h-12 pl-8 bg-card border-input hover:border-ciaf-blue focus:border-ciaf-blue transition-colors text-lg ${showErr("valorTotal") ? "border-destructive focus:border-destructive" : ""}`}
                  />
                </div>
                {jornada && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {esJornadaOrdinaria(jornada as TipoJornada) 
                      ? "Matrícula Ordinaria 2026-I" 
                      : "Matrícula Extraordinaria pago 2026-I"}
                  </p>
                )}
                {showErr("valorTotal") && (
                  <p id="valorTotal-error" role="alert" className="text-sm text-destructive font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" /> {showErr("valorTotal")}
                  </p>
                )}
              </div>

              {/* Cuota Inicial */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-foreground font-medium">
                  <CreditCard className="w-4 h-4 text-ciaf-blue" strokeWidth={2} />
                  Cuota Inicial
                </Label>
                
                <div className="flex rounded-lg border border-input overflow-hidden" role="tablist" aria-label="Tipo de cuota inicial">
                  <button
                    type="button"
                    onClick={() => setTipoCuotaInicial("porcentaje")}
                    role="tab"
                    aria-selected={tipoCuotaInicial === "porcentaje"}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                      tipoCuotaInicial === "porcentaje"
                        ? "bg-ciaf-blue text-white"
                        : "bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Porcentaje (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoCuotaInicial("monto")}
                    role="tab"
                    aria-selected={tipoCuotaInicial === "monto"}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                      tipoCuotaInicial === "monto"
                        ? "bg-ciaf-blue text-white"
                        : "bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Monto ($)
                  </button>
                </div>

                {tipoCuotaInicial === "porcentaje" ? (
                  <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Porcentaje de cuota inicial">
                    {PORCENTAJES_CUOTA_INICIAL.map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setPorcentajeCuotaInicial(pct.toString())}
                        role="radio"
                        aria-checked={porcentajeCuotaInicial === pct.toString()}
                        aria-label={`${pct} por ciento de cuota inicial`}
                        className={`py-3 rounded-lg font-semibold text-sm transition-all ${
                          porcentajeCuotaInicial === pct.toString()
                            ? "bg-ciaf-blue text-white shadow-md"
                            : "bg-muted text-muted-foreground hover:bg-ciaf-blue-light hover:text-ciaf-blue"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Ingrese el monto"
                      value={montoCuotaInicial ? formatCurrency(parseInputValue(montoCuotaInicial)).replace("$", "").trim() : ""}
                      onChange={(e) => setMontoCuotaInicial(e.target.value)}
                      aria-label="Monto de cuota inicial en pesos"
                      aria-invalid={!!showErr("cuotaInicial")}
                      aria-describedby={showErr("cuotaInicial") ? "cuotaInicial-error" : undefined}
                      className={`h-12 pl-8 bg-card border-input hover:border-ciaf-blue focus:border-ciaf-blue transition-colors ${showErr("cuotaInicial") ? "border-destructive focus:border-destructive" : ""}`}
                    />
                  </div>
                )}

                {showErr("cuotaInicial") ? (
                  <p id="cuotaInicial-error" role="alert" className="text-sm text-destructive font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" /> {showErr("cuotaInicial")}
                  </p>
                ) : porcentajeReal > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Info className="w-3 h-3" />
                    Equivalente al {Math.round(porcentajeReal * 100) / 100}% del valor total
                  </p>
                )}
              </div>

              {/* Cantidad de Cuotas */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-foreground font-medium">
                  <Calendar className="w-4 h-4 text-ciaf-blue" strokeWidth={2} />
                  Número de Cuotas
                </Label>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Número de cuotas">
                  {OPCIONES_CUOTAS.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCantidadCuotas(num.toString())}
                      role="radio"
                      aria-checked={cantidadCuotas === num.toString()}
                      className={`py-3 rounded-lg font-semibold transition-all ${
                        cantidadCuotas === num.toString()
                          ? "bg-ciaf-blue text-white shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-ciaf-blue-light hover:text-ciaf-blue"
                      }`}
                    >
                      {num} cuotas
                    </button>
                  ))}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={limpiarFormulario}
                  className="flex-1 h-12 border-input hover:bg-muted transition-all"
                >
                  Limpiar
                </Button>
                <Button
                  type="button"
                  onClick={calcularSimulacion}
                  className="flex-1 h-12 bg-ciaf-blue hover:bg-ciaf-blue-hover transition-all shadow-md hover:shadow-lg text-white font-semibold"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Calcular
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          <Card 
            className={`shadow-lg border border-border/50 transition-all duration-500 bg-card ${
              mostrarResultados ? "opacity-100 animate-scale-in" : "opacity-50"
            }`}
            style={{ animationDelay: "0.2s" }}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl text-ciaf-blue">
                <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
                Resumen del Crédito
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resultados ? (
                <div className="space-y-5">
                  {/* Programa y Semestre */}
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <FileText className="w-4 h-4" />
                      Programa
                    </div>
                    <p className="font-semibold text-foreground leading-tight">{resultados.programa}</p>
                    <p className="text-sm text-ciaf-blue mt-2 font-medium">Semestre {resultados.semestre}</p>
                  </div>

                  {/* 1️⃣ CUOTA INICIAL - PRIORIDAD ALTA */}
                  <InfoCard
                    icon={Banknote}
                    label="Cuota Inicial"
                    value={formatCurrency(resultados.cuotaInicialTotal)}
                    description="Pago único para iniciar tu semestre"
                    priority="high"
                  >
                    {/* Desglose cuota inicial */}
                    <div className="mt-4 p-3 bg-white/80 rounded-lg text-xs space-y-1.5 border border-ciaf-blue/10">
                      <div className="flex justify-between text-ciaf-blue/70">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Abono matrícula ({resultados.porcentajeCuotaInicial}%)
                        </span>
                        <span className="font-medium">{formatCurrency(resultados.cuotaInicialBase)}</span>
                      </div>
                      <div className="flex justify-between text-ciaf-blue/70">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Estudio de crédito
                        </span>
                        <span className="font-medium">{formatCurrency(resultados.estudioCredito)}</span>
                      </div>
                      <div className="flex justify-between text-ciaf-blue/70">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Seguro estudiantil
                        </span>
                        <span className="font-medium">{formatCurrency(resultados.seguroEstudiantil)}</span>
                      </div>
                    </div>

                    {/* Botón pagar cuota inicial */}
                    <Button 
                      onClick={handlePayInitialQuota}
                      className="w-full h-14 mt-4 text-lg font-semibold bg-ciaf-blue hover:bg-ciaf-blue-hover text-white shadow-lg hover:shadow-xl transition-all"
                      size="lg"
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      Pagar cuota inicial ahora
                    </Button>
                    <p className="text-center text-xs text-ciaf-blue/60 mt-2">
                      Este pago activa tu proceso de matrícula
                    </p>
                  </InfoCard>

                  {/* 2️⃣ CUOTA MENSUAL - PRIORIDAD MEDIA */}
                  <InfoCard
                    icon={Calendar}
                    label="Cuota Mensual"
                    value={formatCurrency(resultados.valorPorCuota)}
                    description={`Valor mensual según tu plan de financiación (${resultados.cantidadCuotas} cuotas)`}
                    priority="medium"
                  >
                    <div className="mt-3 p-3 bg-white/80 rounded-lg text-xs border border-ciaf-blue/10">
                      <div className="flex justify-between text-ciaf-blue/70 mb-2">
                        <span className="flex items-center gap-1">
                          <Wallet className="w-3 h-3" />
                          Saldo a financiar
                        </span>
                        <span className="font-medium">{formatCurrency(resultados.montoFinanciar)}</span>
                      </div>
                      <div className="flex justify-between text-ciaf-blue/70 mb-2">
                        <span className="flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          Tasa de interés
                        </span>
                        <span className="font-medium text-emerald-700">0% — Sin intereses</span>
                      </div>
                      <div className="border-t border-ciaf-blue/10 pt-2 mt-2 space-y-1">
                        <p className="text-[11px] uppercase tracking-wider text-ciaf-blue/60 font-semibold mb-1">
                          Plan de cuotas
                        </p>
                        {Array.from({ length: resultados.cantidadCuotas }).map((_, i) => {
                          const esUltima = i === resultados.cantidadCuotas - 1;
                          // Ajuste de redondeo en la última cuota para que la suma cuadre exactamente
                          const valor = esUltima
                            ? resultados.montoFinanciar - resultados.valorPorCuota * (resultados.cantidadCuotas - 1)
                            : resultados.valorPorCuota;
                          return (
                            <div key={i} className="flex justify-between text-ciaf-blue/80">
                              <span>Cuota {i + 1}</span>
                              <span className="font-medium">{formatCurrency(valor)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </InfoCard>

                  {/* Valor Total Matrícula */}
                  <div className="flex items-center justify-between py-3 px-4 border border-border/50 rounded-lg bg-muted/20">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Valor Total Matrícula
                    </span>
                    <span className="font-bold text-lg text-foreground">{formatCurrency(resultados.valorTotal)}</span>
                  </div>

                  {/* Total a pagar (incluye costos fijos) */}
                  <div className="flex items-center justify-between py-3 px-4 border-2 border-ciaf-blue rounded-lg bg-ciaf-blue-light">
                    <div className="flex flex-col">
                      <span className="text-ciaf-blue font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Total a pagar
                      </span>
                      <span className="text-[11px] text-ciaf-blue/70">
                        Matrícula + estudio de crédito{resultados.seguroEstudiantil > 0 ? " + seguro" : ""}
                      </span>
                    </div>
                    <span className="font-bold text-xl text-ciaf-blue">
                      {formatCurrency(resultados.valorTotal + resultados.estudioCredito + resultados.seguroEstudiantil)}
                    </span>
                  </div>

                  {/* 3️⃣ CAJA DE PAGO DE CONTADO */}
                  {showCashPayment && (
                    <CashPaymentBox 
                      valorMatricula={resultados.valorTotal}
                      onClose={handleCloseCashPayment}
                    />
                  )}

                  {/* Mensajes de confianza */}
                  <div className="flex flex-col gap-2 text-xs text-muted-foreground pt-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-ciaf-blue" />
                      <span>Simulación sin compromiso</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-ciaf-blue" />
                      <span>Valores aproximados, sujetos a validación</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-ciaf-blue-light flex items-center justify-center mb-4">
                    <Calculator className="w-8 h-8 text-ciaf-blue" />
                  </div>
                  <p className="text-muted-foreground">
                    Complete el formulario y presione <strong className="text-ciaf-blue">Calcular</strong> para ver el resumen de su crédito
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CIAF · Corporación Instituto de Administración y Finanzas
          </p>
          <p className="text-xs text-muted-foreground/80 mt-2">
            <Link to="/auth" className="hover:text-ciaf-blue transition-colors">
              Acceso colaboradores
            </Link>
          </p>
        </footer>
      </div>

      {/* Pop-up de decisión de financiación */}
      <Dialog open={financingPromptVisible} onOpenChange={handleFinancingDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl text-ciaf-blue">¿Deseas financiar tu semestre?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Elige la opción que mejor se adapte a tu situación
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              onClick={handleSelectFinancing}
              className="h-14 text-base bg-ciaf-blue hover:bg-ciaf-blue-hover transition-all"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Sí, quiero financiar
            </Button>
            <Button 
              onClick={handleSelectCash}
              variant="outline"
              className="h-14 text-base border-border hover:bg-muted/50 transition-all"
            >
              <Banknote className="mr-2 h-5 w-5" />
              No, pagaré de contado
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barra sticky inferior */}
      <StickyFinancingBar
        visible={stickyFinancingVisible}
        onSelectFinancing={handleSelectFinancing}
        onSelectCash={handleSelectCash}
      />

      {/* Modal de pago */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-ciaf-blue">
              <CreditCard className="w-5 h-5" strokeWidth={2} />
              Medios de Pago
            </DialogTitle>
          </DialogHeader>
          
          <p className="text-sm text-foreground leading-relaxed text-center">
            Realiza el pago de tu cuota inicial con cualquiera de estos medios:
          </p>

          {resultados && (
            <div className="bg-ciaf-blue-light border-2 border-ciaf-blue rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-ciaf-blue text-sm mb-1">
                <Wallet className="w-4 h-4" />
                Valor a pagar:
              </div>
              <p className="text-3xl font-bold text-ciaf-blue">
                {formatCurrency(resultados.cuotaInicialTotal)}
              </p>
            </div>
          )}
          
          {/* Código QR */}
          <div className="bg-white border-2 border-border rounded-xl p-4 flex flex-col items-center shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <CreditCard className="w-4 h-4 text-ciaf-blue" />
              Escanea el código QR
            </div>
            <img 
              src={qrDaviplata} 
              alt="Código QR Daviplata CIAF" 
              className="w-full max-w-[200px] h-auto rounded-lg"
            />
          </div>

          {/* Llave de pago Daviplata */}
          <div className="bg-ciaf-blue-light border-2 border-ciaf-blue rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-ciaf-blue text-xs font-medium mb-1">
              <Key className="w-4 h-4" />
              Llave Daviplata
            </div>
            <p className="text-2xl font-mono font-bold text-ciaf-blue">@daviciaf</p>
            <p className="text-xs text-ciaf-blue/70 mt-1">Pago directo sin escanear</p>
          </div>

          {/* Información de contacto */}
          <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs text-foreground font-medium mb-2">
              <Mail className="w-4 h-4 text-ciaf-blue" />
              Envía tu soporte de pago para continuar con tu proceso
            </div>
            
            <div className="flex items-center justify-center gap-3 bg-white rounded-lg p-3 border border-border">
              <MessageCircle className="w-5 h-5 text-ciaf-blue flex-shrink-0" />
              <a 
                href="https://wa.me/573126814341" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-ciaf-blue font-semibold hover:underline transition-all"
              >
                WhatsApp: 312 681 4341
              </a>
            </div>
            
            <div className="flex items-center justify-center gap-3 bg-white rounded-lg p-3 border border-border">
              <Mail className="w-5 h-5 text-ciaf-blue flex-shrink-0" />
              <a 
                href="mailto:pagos@ciaf.edu.co"
                className="text-ciaf-blue font-semibold hover:underline transition-all"
              >
                pagos@ciaf.edu.co
              </a>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground bg-muted/30 rounded-lg p-3 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-ciaf-blue" />
            Una vez verificado tu pago, recibirás confirmación de tu proceso de matrícula.
          </p>

          {/* Solicitud de crédito */}
          <div className="bg-gradient-to-br from-ciaf-blue to-ciaf-blue-hover rounded-xl p-4 text-center text-white space-y-3 shadow-md">
            <div className="flex items-center justify-center gap-2 font-semibold">
              <FileSignature className="w-5 h-5" />
              Paso siguiente: solicitud de crédito
            </div>
            <p className="text-xs text-white/90 leading-relaxed">
              Después de pagar tu cuota inicial, completa el formulario oficial de
              inscripción y solicitud de crédito CIAF para formalizar tu matrícula.
            </p>
            <a
              href="https://ciaf.digital/inscribete/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full bg-white text-ciaf-blue font-semibold rounded-lg px-4 py-2.5 hover:bg-white/90 transition-all"
            >
              Llenar solicitud de crédito
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <Button
            onClick={() => setPaymentModalOpen(false)}
            className="w-full bg-ciaf-blue hover:bg-ciaf-blue-hover text-white transition-all"
          >
            Entendido
          </Button>
        </DialogContent>
      </Dialog>

      {/* Espaciador para sticky bar */}
      {stickyFinancingVisible && <div className="h-32" />}
    </div>
  );
};

export default CreditSimulator;
