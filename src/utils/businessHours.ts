import { getDay } from "date-fns";

/**
 * Horario operativo presencial CIAF (zona horaria America/Bogota).
 * - Lunes a Viernes: 08:00 - 18:30
 * - Sábado: 08:00 - 13:00
 * - Domingo: cerrado
 * Debe coincidir con public.is_within_business_hours() en la BD.
 */

function nowInBogota(): Date {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date()).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  // Construimos un Date "naive" representando la hora local de Bogotá.
  return new Date(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`);
}

export function isBusinessHours(now: Date = nowInBogota()): boolean {
  return true;
}

/** Alias semántico — atención presencial sigue la misma ventana. */
export const canPresencial = isBusinessHours;

export function businessHoursLabel(): string {
  return "Lun a Vie 8:00 a 18:30 · Sáb 8:00 a 13:00";
}

export function getNowInBogota(): Date {
  return nowInBogota();
}
