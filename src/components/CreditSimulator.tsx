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

// Lista completa de programas académicos CIAF
const PROGRAMAS_ACADEMICOS = [
  "Profesional en Administración de Empresas",
  "Profesional en Contaduría Pública INTEP 2021",
  "Profesional en Ingeniería de Software",
  "Profesional en Ingeniería Industrial",
  "Profesional en Seguridad y Salud en el Trabajo",
  "Técnica Profesional en Programación de Software",
  "Técnico Laboral en Mecánica y Mantenimiento de Motocicletas",
  "Técnico Laboral por Competencias en Administrativo en Salud",
  "Técnico Laboral por Competencias en Auxiliar de Veterinaria",
  "Técnico Laboral por Competencias en Auxiliar en Enfermería",
  "Técnico Profesional en Logística de Producción",
  "Técnico Profesional en Operaciones Contables y Financieras",
  "Técnico Profesional en Procesos de Seguridad y Salud en el Trabajo",
  "Técnico Profesional en Procesos Empresariales",
  "Tecnología en Desarrollo de Software",
  "Tecnología en Gestión Contable INTEP 2025",
  "Tecnología en Gestión de la Seguridad y Salud en el Trabajo",
  "Tecnología en Gestión Industrial",
  "Tecnología en Gestión y Auditoría Administrativa",
];

const PORCENTAJES_CUOTA_INICIAL = [20, 30, 40, 50];
const OPCIONES_CUOTAS = [4, 5, 6, 7];
const SEMESTRES = Array.from({ length: 10 }, (_, i) => i + 1);

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
  cuotaInicial: number;
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
    let cuotaInicialCalculada: number;

    if (tipoCuotaInicial === "porcentaje") {
      cuotaInicialCalculada = (total * parseInt(porcentajeCuotaInicial, 10)) / 100;
    } else {
      cuotaInicialCalculada = parseInputValue(montoCuotaInicial);
    }

    const montoFinanciar = total - cuotaInicialCalculada;
    const numCuotas = parseInt(cantidadCuotas, 10);
    const valorPorCuota = montoFinanciar / numCuotas;

    const resultado: ResultadosSimulacion = {
      programa,
      semestre: parseInt(semestre, 10),
      valorTotal: total,
      cuotaInicial: Math.round(cuotaInicialCalculada),
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
                <Select value={programa} onValueChange={setPrograma}>
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
                <Select value={semestre} onValueChange={setSemestre}>
                  <SelectTrigger id="semestre" className="h-12 bg-card border-input hover:border-secondary transition-colors">
                    <SelectValue placeholder="Seleccione el semestre" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    {SEMESTRES.map((sem) => (
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
                <div className="grid grid-cols-4 gap-2">
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

                  {/* Cuota Inicial */}
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <span className="text-muted-foreground">Cuota Inicial</span>
                      <span className="ml-2 text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full font-medium">
                        {resultados.porcentajeCuotaInicial}%
                      </span>
                    </div>
                    <span className="font-bold text-lg text-secondary">{formatCurrency(resultados.cuotaInicial)}</span>
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
