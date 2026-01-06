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
import { Calculator, BookOpen, DollarSign, CreditCard, CheckCircle2, GraduationCap, MessageCircle, Wallet, Mail, Banknote, Calendar, Shield, X } from "lucide-react";
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

// Lista completa de programas académicos CIAF (ordenados alfabéticamente)
const PROGRAMAS_ACADEMICOS = Object.keys(PRECIOS_MATRICULA).sort();

// Obtener semestres disponibles para un programa
const getSemestresDisponibles = (programa: string): number[] => {
  if (!programa || !PRECIOS_MATRICULA[programa]) return [];
  return Object.keys(PRECIOS_MATRICULA[programa]).map(Number).sort((a, b) => a - b);
};

// Obtener precio de matrícula
const getPrecioMatricula = (programa: string, semestre: number): number | null => {
  if (!programa || !PRECIOS_MATRICULA[programa]) return null;
  return PRECIOS_MATRICULA[programa][semestre] || null;
};

const PORCENTAJES_CUOTA_INICIAL = [20, 30, 40, 50];
const OPCIONES_CUOTAS = [4, 5, 6];

// Costos fijos adicionales incluidos en la cuota inicial
const ESTUDIO_CREDITO = 48000;
const SEGURO_ESTUDIANTIL = 14860;

// Constantes para el flujo de financiación
const POPUP_TIMEOUT = 10000; // 10 segundos
const FINANCING_DECISION_KEY = "ciaf_financing_decision";

// Formatear moneda colombiana
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
};

// Parsear valor de entrada
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
      className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 animate-in slide-in-from-bottom duration-300"
      style={{ boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.1)" }}
    >
      <div className="max-w-2xl mx-auto px-4 py-4">
        <p className="text-center text-sm text-muted-foreground mb-2">
          Aún puedes elegir tu forma de pago
        </p>
        <p className="text-center font-medium mb-3">¿Deseas financiar?</p>
        <div className="flex gap-3">
          <Button 
            onClick={onSelectFinancing}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Sí, quiero financiar
          </Button>
          <Button 
            onClick={onSelectCash}
            variant="outline"
            className="flex-1 h-12 border-gray-300"
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
  
  // Estados del flujo de financiación
  const [financingPromptVisible, setFinancingPromptVisible] = useState(false);
  const [financingDismissed, setFinancingDismissed] = useState(false);
  const [stickyFinancingVisible, setStickyFinancingVisible] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const popupTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar decisión guardada de localStorage
  useEffect(() => {
    const savedDecision = localStorage.getItem(FINANCING_DECISION_KEY);
    if (savedDecision === "no") {
      setFinancingDismissed(true);
    }
  }, []);

  // Timer para mostrar el pop-up después de calcular
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

  // Auto-cerrar pop-up y mostrar sticky después de 10 segundos
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

  // Semestres disponibles para el programa seleccionado
  const semestresDisponibles = useMemo(() => getSemestresDisponibles(programa), [programa]);

  // Auto-llenar precio cuando cambia programa o semestre
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

  // Calcular porcentaje real de cuota inicial
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

  // Validar formulario
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

  // Calcular simulación
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

    // Seguro estudiantil solo aplica para semestres impares (1, 3, 5, 7, 9)
    const esSestreImpar = semestreNum % 2 !== 0;
    const seguroAplicable = esSestreImpar ? SEGURO_ESTUDIANTIL : 0;

    // Cuota inicial total = base + estudio de crédito + seguro estudiantil (si aplica)
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

  // Limpiar formulario
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
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (popupTimerRef.current) {
      clearTimeout(popupTimerRef.current);
    }
  };

  // Handlers del flujo de financiación
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
    // Abrir modal de pago
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
            <div className="h-1 w-24 gradient-primary rounded-full" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-3">
            Simulador de Créditos
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Calcula el valor de tu matrícula, cuota inicial y plan de pagos de forma rápida y sencilla
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Formulario */}
          <Card className="shadow-card border-0 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl text-primary">
                <Calculator className="w-5 h-5 text-secondary" />
                Información del Crédito
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Programa Académico */}
              <div className="space-y-2">
                <Label htmlFor="programa" className="flex items-center gap-2 text-foreground font-medium">
                  <BookOpen className="w-4 h-4 text-secondary" />
                  Programa Académico
                </Label>
                <Select value={programa} onValueChange={handleProgramaChange}>
                  <SelectTrigger id="programa" className="h-12 bg-card border-input hover:border-secondary transition-colors">
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
                  <GraduationCap className="w-4 h-4 text-secondary" />
                  Semestre
                </Label>
                <Select 
                  value={semestre} 
                  onValueChange={handleSemestreChange}
                  disabled={!programa}
                >
                  <SelectTrigger id="semestre" className="h-12 bg-card border-input hover:border-secondary transition-colors">
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
                  <DollarSign className="w-4 h-4 text-secondary" />
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
                    className="h-12 pl-8 bg-card border-input hover:border-secondary focus:border-secondary transition-colors text-lg"
                  />
                </div>
              </div>

              {/* Cuota Inicial */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-foreground font-medium">
                  <CreditCard className="w-4 h-4 text-secondary" />
                  Cuota Inicial
                </Label>
                
                {/* Toggle entre porcentaje y monto */}
                <div className="flex rounded-lg border border-input overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setTipoCuotaInicial("porcentaje")}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                      tipoCuotaInicial === "porcentaje"
                        ? "bg-primary text-primary-foreground"
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
                        ? "bg-primary text-primary-foreground"
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
                            ? "bg-secondary text-secondary-foreground shadow-soft"
                            : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
                      className="h-12 pl-8 bg-card border-input hover:border-secondary focus:border-secondary transition-colors"
                    />
                  </div>
                )}

                {/* Indicador de porcentaje mínimo */}
                {porcentajeReal > 0 && porcentajeReal < 20 && (
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ La cuota inicial debe ser mínimo el 20%
                  </p>
                )}
              </div>

              {/* Cantidad de Cuotas */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-foreground font-medium">
                  <CreditCard className="w-4 h-4 text-secondary" />
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
                          ? "bg-secondary text-secondary-foreground shadow-soft"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
                  className="flex-1 h-12 gradient-primary hover:opacity-90 transition-all shadow-soft hover:shadow-hover text-primary-foreground font-semibold"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Calcular
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resultados con nueva jerarquía */}
          <Card 
            className={`shadow-card border-0 transition-all duration-500 ${
              mostrarResultados ? "opacity-100 animate-scale-in" : "opacity-50"
            }`}
            style={{ animationDelay: "0.2s" }}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl text-primary">
                <CheckCircle2 className="w-5 h-5 text-secondary" />
                Resumen del Crédito
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resultados ? (
                <div className="space-y-4">
                  {/* Programa y Semestre */}
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-1">Programa</p>
                    <p className="font-semibold text-foreground leading-tight">{resultados.programa}</p>
                    <p className="text-sm text-secondary mt-2">Semestre {resultados.semestre}</p>
                  </div>

                  {/* 1️⃣ CUOTA INICIAL - PRIORIDAD ALTA */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5">
                    <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                      <Banknote className="w-5 h-5" />
                      <span className="text-sm font-medium uppercase tracking-wide">Cuota Inicial</span>
                    </div>
                    <p className="text-4xl font-bold text-blue-600 text-center">
                      {formatCurrency(resultados.cuotaInicialTotal)}
                    </p>
                    <p className="text-sm text-blue-600/70 text-center mt-2">
                      💳 Pago único para iniciar tu semestre
                    </p>
                    
                    {/* Desglose cuota inicial */}
                    <div className="mt-4 p-3 bg-white/60 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between text-blue-700/70">
                        <span>Abono matrícula ({resultados.porcentajeCuotaInicial}%)</span>
                        <span>{formatCurrency(resultados.cuotaInicialBase)}</span>
                      </div>
                      <div className="flex justify-between text-blue-700/70">
                        <span>Estudio de crédito</span>
                        <span>{formatCurrency(resultados.estudioCredito)}</span>
                      </div>
                      <div className="flex justify-between text-blue-700/70">
                        <span>Seguro estudiantil</span>
                        <span>{formatCurrency(resultados.seguroEstudiantil)}</span>
                      </div>
                    </div>

                    {/* Botón pagar cuota inicial - AZUL */}
                    <Button 
                      onClick={handlePayInitialQuota}
                      className="w-full h-14 mt-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
                      size="lg"
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      Pagar cuota inicial ahora
                    </Button>
                    <p className="text-center text-xs text-blue-600/60 mt-2">
                      Este pago activa tu proceso de matrícula
                    </p>
                  </div>

                  {/* 2️⃣ CUOTA MENSUAL - PRIORIDAD MEDIA */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-xl p-5">
                    <div className="flex items-center justify-center gap-2 text-emerald-600 mb-2">
                      <Calendar className="w-5 h-5" />
                      <span className="text-sm font-medium uppercase tracking-wide">Cuota Mensual</span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-600 text-center">
                      {formatCurrency(resultados.valorPorCuota)}
                    </p>
                    <p className="text-sm text-emerald-600/70 text-center mt-2">
                      📘 Valor mensual según tu plan de financiación ({resultados.cantidadCuotas} cuotas)
                    </p>
                    
                    <div className="mt-3 p-3 bg-white/60 rounded-lg text-xs">
                      <div className="flex justify-between text-emerald-700/70">
                        <span>Saldo a financiar</span>
                        <span>{formatCurrency(resultados.montoFinanciar)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Valor Total Matrícula */}
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <span className="text-muted-foreground">Valor Total Matrícula</span>
                    <span className="font-bold text-lg text-foreground">{formatCurrency(resultados.valorTotal)}</span>
                  </div>

                  {/* Mensajes de confianza */}
                  <div className="flex flex-col gap-2 text-xs text-muted-foreground pt-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span>Simulación sin compromiso</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Valores aproximados, sujetos a validación</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Calculator className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Complete el formulario y presione <strong>Calcular</strong> para ver el resumen de su crédito
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
            <DialogTitle className="text-xl">¿Deseas financiar tu semestre?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Elige la opción que mejor se adapte a tu situación
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              onClick={handleSelectFinancing}
              className="h-14 text-base bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Sí, quiero financiar
            </Button>
            <Button 
              onClick={handleSelectCash}
              variant="outline"
              className="h-14 text-base border-gray-300 hover:bg-gray-50"
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
            <DialogTitle className="flex items-center gap-2 text-secondary text-center">
              <Wallet className="w-5 h-5" />
              Instrucciones de Pago
            </DialogTitle>
          </DialogHeader>
          
          <p className="text-sm text-foreground leading-relaxed">
            Para completar tu financiación, realiza el pago de tu cuota inicial:
          </p>
          
          {/* Código QR */}
          <div className="bg-muted rounded-lg p-4 flex flex-col items-center">
            <img 
              src={qrDaviplata} 
              alt="Código QR Daviplata CIAF" 
              className="w-full max-w-[240px] h-auto rounded-lg"
            />
          </div>

          {resultados && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-600 mb-1">Valor a pagar:</p>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(resultados.cuotaInicialTotal)}
              </p>
            </div>
          )}

          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">También puedes pagar con Daviplata</p>
            <p className="text-lg font-mono font-bold text-foreground">315 578 6696</p>
            <p className="text-xs text-muted-foreground mt-1">A nombre de: CIAF S.A.S</p>
          </div>

          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-2 text-center">
              Después de pagar, envía tu comprobante a:
            </p>
            <div className="flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <a 
                href="https://wa.me/573155786696" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-600 font-medium hover:underline"
              >
                WhatsApp: 315 578 6696
              </a>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <a 
                href="mailto:financiacion@ciaf.edu.co"
                className="text-blue-600 font-medium hover:underline"
              >
                financiacion@ciaf.edu.co
              </a>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Una vez verificado tu pago, recibirás confirmación de tu proceso de matrícula.
          </p>

          <Button
            onClick={() => setPaymentModalOpen(false)}
            variant="outline"
            className="w-full mt-2"
          >
            Cerrar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Espaciador para sticky bar */}
      {stickyFinancingVisible && <div className="h-32" />}
    </div>
  );
};

export default CreditSimulator;
