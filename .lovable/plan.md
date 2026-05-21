# Plan de evolución a plataforma Fintech Educativa + CRM + Turnos Inteligentes

El alcance que describes es enorme (equivalente a 2–3 meses de trabajo de un equipo). No se puede entregar todo de una vez sin romper lo que ya funciona. Propongo dividirlo en **5 fases incrementales**, conservando 100% de la lógica actual (simulador, turnos públicos, dashboard admin, auth de los 4 correos).

Importante sobre stack: el proyecto ya corre en **React + Vite + Tailwind + Lovable Cloud (Supabase)**. NO se puede migrar a NestJS/Prisma/PostgreSQL externo dentro de Lovable. Toda la "arquitectura backend" se implementará con **tablas + RLS + funciones SQL + edge functions**, que es el equivalente real y seguro en este entorno. Auth, JWT, RLS, roles y logs ya están cubiertos por Lovable Cloud.

---

## Fase 1 — Rebranding visual corporativo (base de todo)

Aplicar paleta oficial en todo el sistema antes de añadir features.

- Actualizar `src/index.css` y `tailwind.config.ts`:
  - `--ciaf-blue: 220 100% 16%` (#001550)
  - `--ciaf-blue-hover: 217 97% 26%` (#013084)
  - `--ciaf-light-blue: 200 94% 44%` (#0699d9)
- Tokens semánticos para: primary, sidebar, badges, estados (pendiente/atención/finalizado), gradientes fintech, glass, shadows.
- Revisar componentes que usan colores hardcoded y migrar a tokens.
- Pulir: Segmentacion, Welcome, Dashboard, AdminShell, TurnoForm, TurnosTable, Auth con look fintech (glassmorphism sutil, sombras suaves, microanimaciones framer-motion ya instaladas).

## Fase 2 — Asesoras + asignación automática por carga

Modelo de datos y lógica de balanceo (el corazón del sistema).

- Tabla `asesores` ya existe → ampliar con: `hora_inicio`, `hora_fin`, `max_capacidad`, `tiempo_promedio_min`, `is_online`, `estado` (disponible/ocupada/pausa/almuerzo/offline/fin_jornada).
- Seed: Mariana Pacheco, Juliana Mejía, Elena Cabrera.
- Función SQL `assign_advisor()`:
  1. Filtra asesoras `is_online=true`, dentro de horario, estado válido, con cupo.
  2. Cuenta turnos activos (`pendiente`+`en_proceso`) por asesora.
  3. Devuelve la de menor carga (desempate por menor tiempo acumulado).
- Modificar `request_turno()` para llamar `assign_advisor()` y guardar `asesor_id` automáticamente.
- En el ticket de confirmación mostrar: número de turno, asesora asignada, personas delante, tiempo estimado (`personas * tiempo_promedio`). Si no hay cola, ocultar "personas delante".
- Modal de confirmación: mínimo 10s, transición elegante, botón "Continuar al simulador".
- Badge flotante persistente (esquina superior izquierda) con número de turno + asesora + estado, visible durante toda la navegación (sobrevive cambios de ruta via localStorage + contexto).

## Fase 3 — Programa académico automático por carrera + semestre

- Constante `PROGRAMAS_POR_CICLO` con los ciclos propedéuticos que listaste (Admin, Contaduría, SST, Software, Industrial, Enfermería, Veterinaria, Motos, Adm Salud).
- Helper `getProgramaAcademico(carrera, semestre)` → nombre exacto del programa.
- Mostrar en TurnoForm (al elegir carrera+semestre), en el ticket, en el dashboard (columna Programa), y enviarlo al simulador como contexto.

## Fase 4 — Flujo Financiación con timeline + firma

Cuando tipificación = "Financiación":

- Tabla `financiaciones`: `turno_id`, `estado` (pendiente/en_revision/aprobado/rechazado/req_documentos/en_firma/finalizado), `firmado` (bool), `firma_fecha`, `observaciones`.
- Después del simulador, paso de "Estudio de crédito" con datos básicos.
- Timeline visual del estado.
- Vista admin: cambiar estado, marcar firma, agregar observaciones.

## Fase 5 — Dashboards premium + realtime + kanban

- Realtime ya activo en `turnos` → extender a `asesores` y `financiaciones`.
- Dashboard admin (los 4 correos):
  - KPIs: turnos hoy, en espera, en atención, tiempo promedio, conversión a financiación, firmas pendientes.
  - Kanban: Esperando / En atención / Finalizados.
  - Rendimiento por asesora (gráficos Recharts ya instalados).
  - Filtros avanzados, búsqueda, exportar.
- Dashboard personal por asesora (nueva ruta `/asesora`, protegida por rol `asesor`).

---

## Lo que NO se hace (y por qué)

- **NestJS / Prisma / Postgres externo / WebSockets propios**: no aplica en Lovable. Se usa Supabase (RLS + Realtime + Edge Functions), que cumple el mismo objetivo de seguridad y escalabilidad.
- **Rate limiting backend**: el entorno no tiene primitivas estables; se omite (configurable después).
- **IA de predicción de abandono (Nivel 3)**: fuera de alcance inicial; se puede agregar luego con Lovable AI Gateway.
- **Login de estudiantes**: confirmaste antes que los turnos son públicos. Se mantiene así. Solo admin/asesoras se loguean.

---

## Pregunta antes de empezar

¿Arranco por **Fase 1 (rebranding visual)** y **Fase 2 (asesoras + asignación automática + ticket persistente)** en esta iteración? Son las que cambian más la percepción "fintech" y desbloquean el resto. Las fases 3–5 las hacemos en mensajes siguientes para mantener calidad y poder validar cada paso.
