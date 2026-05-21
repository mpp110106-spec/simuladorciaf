// Programa académico automático según carrera + semestre.
// Estructura propedéutica: Técnico (1–3), Tecnólogo (4–6), Profesional (7+).

type Ciclo = {
  tecnico: string;
  tecnologo: string;
  profesional: string;
};

export const PROGRAMAS_POR_CICLO: Record<string, Ciclo> = {
  "Administración de Empresas": {
    tecnico: "Técnico Laboral por Competencias en Asistente Administrativo",
    tecnologo: "Tecnología en Gestión Empresarial",
    profesional: "Administración de Empresas",
  },
  "Contaduría Pública": {
    tecnico: "Técnico Laboral por Competencias en Asistente Contable y Financiero",
    tecnologo: "Tecnología en Gestión Contable y Financiera",
    profesional: "Contaduría Pública",
  },
  "SST": {
    tecnico: "Técnico Laboral por Competencias en Seguridad y Salud en el Trabajo",
    tecnologo: "Tecnología en Seguridad y Salud en el Trabajo",
    profesional: "Administración en Seguridad y Salud en el Trabajo",
  },
  "Ingeniería de Software": {
    tecnico: "Técnico Laboral por Competencias en Programación de Software",
    tecnologo: "Tecnología en Desarrollo de Software",
    profesional: "Ingeniería de Software",
  },
  "Ingeniería Industrial": {
    tecnico: "Técnico Laboral por Competencias en Procesos Industriales",
    tecnologo: "Tecnología en Gestión Industrial",
    profesional: "Ingeniería Industrial",
  },
  "Enfermería": {
    tecnico: "Técnico Laboral por Competencias en Auxiliar de Enfermería",
    tecnologo: "Tecnología en Atención Prehospitalaria",
    profesional: "Enfermería",
  },
  "Veterinaria": {
    tecnico: "Técnico Laboral por Competencias en Auxiliar Veterinario",
    tecnologo: "Tecnología en Producción Animal",
    profesional: "Medicina Veterinaria",
  },
  "Motos": {
    tecnico: "Técnico Laboral por Competencias en Mecánica de Motos",
    tecnologo: "Tecnología en Mecánica Automotriz",
    profesional: "Ingeniería Mecánica",
  },
  "Administración en Salud": {
    tecnico: "Técnico Laboral por Competencias en Administrativo en Salud",
    tecnologo: "Tecnología en Administración en Salud",
    profesional: "Administración en Salud",
  },
};

export type NivelAcademico = "Técnico" | "Tecnólogo" | "Profesional";

export const getNivelAcademico = (semestre: number): NivelAcademico => {
  if (semestre <= 3) return "Técnico";
  if (semestre <= 6) return "Tecnólogo";
  return "Profesional";
};

export const getProgramaAcademico = (
  carrera: string | null | undefined,
  semestre: number | null | undefined
): string | null => {
  if (!carrera || !semestre) return null;
  const ciclo = PROGRAMAS_POR_CICLO[carrera];
  if (!ciclo) return carrera;
  if (semestre <= 3) return ciclo.tecnico;
  if (semestre <= 6) return ciclo.tecnologo;
  return ciclo.profesional;
};