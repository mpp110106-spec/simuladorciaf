import { useState, useMemo, useCallback } from "react";
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
import logoCiaf from "@/assets/logo-ciaf-azul.png";
import { Calculator, BookOpen, DollarSign, CreditCard, CheckCircle2, GraduationCap } from "lucide-react";
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
const ESTUDIO_CREDITO = 45000;
const SEGURO_ESTUDIANTIL = 14080; // Solo aplica para semestres impares

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

          {/* Resultados */}
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

                  {/* Valor Total */}
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Valor Total Matrícula</span>
                    <span className="font-bold text-lg text-foreground">{formatCurrency(resultados.valorTotal)}</span>
                  </div>

                  {/* Cuota Inicial Base */}
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <span className="text-muted-foreground">Cuota Inicial</span>
                      <span className="ml-2 text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full font-medium">
                        {resultados.porcentajeCuotaInicial}%
                      </span>
                    </div>
                    <span className="font-semibold text-foreground">{formatCurrency(resultados.cuotaInicialBase)}</span>
                  </div>

                  {/* Estudio de Crédito */}
                  <div className="flex items-center justify-between py-2 border-b border-border/50 pl-4">
                    <span className="text-sm text-muted-foreground">+ Estudio de Crédito</span>
                    <span className="text-sm font-medium text-foreground">{formatCurrency(resultados.estudioCredito)}</span>
                  </div>

                  {/* Seguro Estudiantil */}
                  <div className="flex items-center justify-between py-2 border-b border-border/50 pl-4">
                    <span className="text-sm text-muted-foreground">+ Seguro Estudiantil</span>
                    <span className="text-sm font-medium text-foreground">{formatCurrency(resultados.seguroEstudiantil)}</span>
                  </div>

                  {/* Total Cuota Inicial */}
                  <div className="flex items-center justify-between py-3 border-b border-border bg-muted/30 rounded-lg px-3 -mx-1">
                    <span className="font-medium text-foreground">Total a Pagar (Cuota Inicial)</span>
                    <span className="font-bold text-lg text-secondary">{formatCurrency(resultados.cuotaInicialTotal)}</span>
                  </div>

                  {/* Monto a Financiar */}
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Monto a Financiar</span>
                    <span className="font-bold text-lg text-foreground">{formatCurrency(resultados.montoFinanciar)}</span>
                  </div>

                  {/* Número de Cuotas */}
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Número de Cuotas</span>
                    <span className="font-bold text-lg text-foreground">{resultados.cantidadCuotas} cuotas</span>
                  </div>

                  {/* Valor por Cuota - Destacado */}
                  <div className="gradient-primary rounded-xl p-5 mt-4">
                    <p className="text-primary-foreground/80 text-sm mb-1">Valor de Cada Cuota</p>
                    <p className="text-3xl font-bold text-primary-foreground">
                      {formatCurrency(resultados.valorPorCuota)}
                    </p>
                  </div>

                  {/* Nota informativa */}
                  <p className="text-xs text-muted-foreground text-center mt-4 leading-relaxed">
                    * Esta es una simulación orientativa. Los valores definitivos pueden variar según las condiciones establecidas por CIAF.
                  </p>
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
    </div>
  );
};

export default CreditSimulator;
