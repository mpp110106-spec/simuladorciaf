import { z } from "zod";

import { CARRERAS } from "@/lib/constants";

export const turnoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(120, "Máximo 120 caracteres"),
  telefono: z
    .string()
    .trim()
    .regex(/^[0-9+\s-]+$/, "Solo números y separadores válidos")
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Mínimo 10 dígitos"),
  correo: z
    .string()
    .trim()
    .email("Correo inválido")
    .max(255, "Máximo 255 caracteres"),
  tipificacion: z.enum(["Financiación", "Consultas", "Otros"], {
    errorMap: () => ({ message: "Selecciona una opción" }),
  }),
  carrera: z
    .string({ required_error: "Selecciona tu carrera" })
    .refine((v) => CARRERAS.includes(v), { message: "Selecciona tu carrera" }),
  semestre: z
    .number({ invalid_type_error: "Selecciona tu semestre" })
    .int()
    .min(1, "Selecciona tu semestre")
    .max(10, "Máximo 10"),
});

export type TurnoFormData = z.infer<typeof turnoSchema>;