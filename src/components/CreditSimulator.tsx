import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
  FileText
} from "lucide-react";
import { toast } from "sonner";

// Mapa de precios de matrícula por programa y semestre (Matrícula Ordinaria 2026)
const PRECIOS_MATRICULA: Record<string, Record<number, number>> = {
  "Técnico Profesional en Procesos Empresariales": {
    1: 2512000, 2: 2512000, 3: 2512000, 4: 2512000
  },
  "Tecnología en Gestión y Auditoría Administrativa": {
    5: 2628000, 6: 2628000, 7: 2628000
  },
  "Profesional en Administración de Empresas": {
    8: 3223000, 9: 3223000, 10: 3223000
  },
  "Técnica Profesional en Programación de Software": {
    1: 2640000, 2: 2640000, 3: 2640000, 4: 2640000
  },
  "Tecnología en Desarrollo de Software": {
    5: 3014000, 6: 3014000, 7: 3014000
  },
  "Profesional en Ingeniería de Software": {
    8: 3561000, 9: 3561000, 10: 3561000
  },
  "Técnico Profesional en Procesos de Seguridad y Salud en el Trabajo": {
    1: 2640000, 2: 2640000, 3: 2640000, 4: 2640000
  },
  "Tecnología en Gestión de la Seguridad y Salud en el Trabajo": {
    5: 2937000, 6: 2937000
  },
  "Profesional en Seguridad y Salud en el Trabajo": {
    7: 3223000, 8: 3223000, 9: 3223000, 10: 3223000
  },
  "Técnico Profesional en Logística de Producción": {
    1: 2654000, 2: 2654000, 3: 2654000, 4: 2654000
  },
  "Tecnología en Gestión Industrial": {
    5: 3227000, 6: 3227000, 7: 3227000
  },
  "Profesional en Ingeniería Industrial": {
    8: 3540000, 9: 3540000, 10: 3540000
  },
  "Técnico Laboral en Mecánica y Mantenimiento de Motocicletas": {
    1: 2224000, 2: 2224000
  },
  "Técnico Laboral por Competencias en Auxiliar en Enfermería": {
    1: 2365000, 2: 2365000, 3: 2365000
  },
  "Técnico Laboral por Competencias en Administrativo en Salud": {
    1: 1863000, 2: 1863000, 3: 1863000
  },
  "Técnico Laboral por Competencias en Auxiliar de Veterinaria": {
    1: 2400000, 2: 2400000
  },
  "Técnico Profesional en Operaciones Contables y Financieras": {
    1: 2129000, 2: 2129000, 3: 2129000, 4: 2129000
  },
  "Tecnología en Gestión Contable INTEP 2025": {
    5: 2705000, 6: 2705000, 7: 2705000
  },
  "Profesional en Contaduría Pública INTEP 2021": {
    8: 3349000, 9: 3349000, 10: 3349000
  }
};

const PROGRAMAS_ACADEMICOS = Object.keys(PRECIOS_MATRICULA).sort();

const getSemestresDisponibles = (programa: string): number[] => {
  if (!programa || !PRECIOS_MATRICULA[programa]) return [];
  return Object.keys(PRECIOS_MATRICULA[programa]).map(Number).sort((a, b) => a - b);
};

const getPrecioMatricula = (programa: string, semestre: number): number | null => {
  if (!programa || !PRECIOS_MATRICULA[programa]) return null;
  return PRECIOS_MATRICULA[programa][semestre] || null;
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

// Componente: Caja de Información Profesional
const InfoCard = ({ 
  icon: Icon, 
  label, 
  value, 
  description, 
  priority = "normal",
  children 
}: { 
  icon: React.ElementType;
  label: string;
  value: string;
  description: string;
  priority?: "high" | "medium" | "normal";
  children?: React.ReactNode;
}) => {
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
  const [programa, setPrograma] = useState<string>("");
  const [semestre, setSemestre] = useState<string>("");
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
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const popupTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    setValorTotal("");
  };

  const handleSemestreChange = (nuevoSemestre: string) => {
    setSemestre(nuevoSemestre);
    const precio = getPrecioMatricula(programa, parseInt(nuevoSemestre, 10));
    if (precio) {
      setValorTotal(precio.toString());
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

  const validarFormulario = useCallback((): boolean => {
    if (!programa) {
      toast.error("Por favor seleccione un programa académico");
      return false;
    }
    if (!semestre) {
      toast.error("Por favor seleccione un semestre");
      return false;
    }
    const total = parseInputValue(valorTotal);
    if (total <= 0) {
      toast.error("Por favor ingrese un valor de matrícula válido");
      return false;
    }
    if (porcentajeReal < 20) {
      toast.error("La cuota inicial no puede ser menor al 20%");
      return false;
    }
    if (porcentajeReal > 100) {
      toast.error("La cuota inicial no puede ser mayor al 100%");
      return false;
    }
    return true;
  }, [programa, semestre, valorTotal, porcentajeReal]);

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
    toast.success("Simulación calculada correctamente");
  }, [programa, semestre, valorTotal, tipoCuotaInicial, porcentajeCuotaInicial, montoCuotaInicial, cantidadCuotas, porcentajeReal, validarFormulario]);

  const limpiarFormulario = () => {
    setPrograma("");
    setSemestre("");
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
    localStorage.setItem(FINANCING_DECISION_KEY, "yes");
    setPaymentModalOpen(true);
  };

  const handleSelectCash = () => {
    setFinancingPromptVisible(false);
    setStickyFinancingVisible(false);
    setFinancingDismissed(true);
    localStorage.setItem(FINANCING_DECISION_KEY, "no");
    toast.info("Perfecto, puedes pagar de contado cuando desees");
  };

  const handlePayInitialQuota = () => {
    setPaymentModalOpen(true);
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
                  <SelectTrigger id="programa" className="h-12 bg-card border-input hover:border-ciaf-blue transition-colors">
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
                  <SelectTrigger id="semestre" className="h-12 bg-card border-input hover:border-ciaf-blue transition-colors">
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
                    className="h-12 pl-8 bg-card border-input hover:border-ciaf-blue focus:border-ciaf-blue transition-colors text-lg"
                  />
                </div>
              </div>

              {/* Cuota Inicial */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-foreground font-medium">
                  <CreditCard className="w-4 h-4 text-ciaf-blue" strokeWidth={2} />
                  Cuota Inicial
                </Label>
                
                <div className="flex rounded-lg border border-input overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setTipoCuotaInicial("porcentaje")}
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
                  <div className="grid grid-cols-4 gap-2">
                    {PORCENTAJES_CUOTA_INICIAL.map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setPorcentajeCuotaInicial(pct.toString())}
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
                      className="h-12 pl-8 bg-card border-input hover:border-ciaf-blue focus:border-ciaf-blue transition-colors"
                    />
                  </div>
                )}

                {porcentajeReal > 0 && porcentajeReal < 20 && (
                  <p className="text-sm text-destructive font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    La cuota inicial debe ser mínimo el 20%
                  </p>
                )}
              </div>

              {/* Cantidad de Cuotas */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-foreground font-medium">
                  <Calendar className="w-4 h-4 text-ciaf-blue" strokeWidth={2} />
                  Número de Cuotas
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {OPCIONES_CUOTAS.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCantidadCuotas(num.toString())}
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
                      <div className="flex justify-between text-ciaf-blue/70">
                        <span className="flex items-center gap-1">
                          <Wallet className="w-3 h-3" />
                          Saldo a financiar
                        </span>
                        <span className="font-medium">{formatCurrency(resultados.montoFinanciar)}</span>
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
            © {new Date().getFullYear()} CIAF - Centro de Instrucción y Aprendizaje Financiero
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
