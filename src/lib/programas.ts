// Programa académico automático según carrera + semestre.
// Configuración real CIAF: cada carrera define rangos de semestres con su programa correspondiente.

type RangoPrograma = {
  min: number;
  max: number;
  nombre: string;
  nivel: NivelAcademico;
};

export type NivelAcademico = "Técnico" | "Tecnólogo" | "Profesional";

export const PROGRAMAS_POR_CARRERA: Record<string, RangoPrograma[]> = {
  "Administración de Empresas": [
    { min: 1, max: 4, nombre: "Técnico Profesional en Procesos Empresariales", nivel: "Técnico" },
    { min: 5, max: 7, nombre: "Tecnología en Gestión y Auditoría Administrativa", nivel: "Tecnólogo" },
    { min: 8, max: 10, nombre: "Profesional en Administración de Empresas", nivel: "Profesional" },
  ],
  "Contaduría Pública": [
    { min: 1, max: 4, nombre: "Técnico Profesional en Operaciones Contables y Financieras", nivel: "Técnico" },
    { min: 5, max: 7, nombre: "Tecnología en Gestión Contable INTEP 2025", nivel: "Tecnólogo" },
    { min: 8, max: 10, nombre: "Profesional en Contaduría Pública INTEP 2021", nivel: "Profesional" },
  ],
  "SST": [
    { min: 1, max: 4, nombre: "Técnico Profesional en Procesos de Seguridad y Salud en el Trabajo", nivel: "Técnico" },
    { min: 5, max: 6, nombre: "Tecnología en Gestión de la Seguridad y Salud en el Trabajo", nivel: "Tecnólogo" },
    { min: 7, max: 10, nombre: "Profesional en Seguridad y Salud en el Trabajo", nivel: "Profesional" },
  ],
  "Ingeniería de Software": [
    { min: 1, max: 4, nombre: "Técnica Profesional en Programación de Software", nivel: "Técnico" },
    { min: 5, max: 7, nombre: "Tecnología en Desarrollo de Software", nivel: "Tecnólogo" },
    { min: 8, max: 10, nombre: "Profesional en Ingeniería de Software", nivel: "Profesional" },
  ],
  "Ingeniería Industrial": [
    { min: 1, max: 4, nombre: "Técnico Profesional en Logística de Producción", nivel: "Técnico" },
    { min: 5, max: 7, nombre: "Tecnología en Gestión Industrial", nivel: "Tecnólogo" },
    { min: 8, max: 10, nombre: "Profesional en Ingeniería Industrial", nivel: "Profesional" },
  ],
  "Enfermería": [
    { min: 1, max: 3, nombre: "Técnico Laboral por Competencias en Auxiliar en Enfermería", nivel: "Técnico" },
  ],
  "Veterinaria": [
    { min: 1, max: 3, nombre: "Técnico Laboral por Competencias en Auxiliar de Veterinaria y Cuidado de Mascotas", nivel: "Técnico" },
  ],
  "Motos": [
    { min: 1, max: 3, nombre: "Técnico Laboral en Mecánica y Mantenimiento de Motocicletas", nivel: "Técnico" },
  ],
  "Administración en Salud": [
    { min: 1, max: 3, nombre: "Técnico Laboral por Competencias en Administrativo en Salud", nivel: "Técnico" },
  ],
};

export const getMaxSemestre = (carrera: string | null | undefined): number => {
  if (!carrera) return 10;
  const rangos = PROGRAMAS_POR_CARRERA[carrera];
  if (!rangos || rangos.length === 0) return 10;
  return Math.max(...rangos.map((r) => r.max));
};

export const getSemestresDisponibles = (carrera: string | null | undefined): number[] => {
  const max = getMaxSemestre(carrera);
  return Array.from({ length: max }, (_, i) => i + 1);
};

export const getNivelAcademico = (
  semestre: number,
  carrera?: string | null,
): NivelAcademico => {
  if (carrera) {
    const rangos = PROGRAMAS_POR_CARRERA[carrera];
    const r = rangos?.find((x) => semestre >= x.min && semestre <= x.max);
    if (r) return r.nivel;
  }
  if (semestre <= 3) return "Técnico";
  if (semestre <= 6) return "Tecnólogo";
  return "Profesional";
};

export const getProgramaAcademico = (
  carrera: string | null | undefined,
  semestre: number | null | undefined,
): string | null => {
  if (!carrera || !semestre) return null;
  const rangos = PROGRAMAS_POR_CARRERA[carrera];
  if (!rangos) return carrera;
  const r = rangos.find((x) => semestre >= x.min && semestre <= x.max);
  return r ? r.nombre : carrera;
};