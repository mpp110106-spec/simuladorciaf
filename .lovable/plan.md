# Centro de Control Ejecutivo CIAF

Módulo exclusivo `/admin` para `direccion.riesgos@ciaf.edu.co` — operación completa en tiempo real, multi-sede, con satisfacción y ranking.

Lo divido en **4 fases** para validar progreso entre cada una.

---

## FASE 1 — Modelo de datos: sedes + satisfacción + rol superadmin

Migración SQL:

1. **Rol `superadmin`** en enum `app_role` (separado de `admin`). Trigger asigna `superadmin` al correo `direccion.riesgos@ciaf.edu.co` al iniciar sesión. Las demás cuentas admin existentes mantienen `admin`.
2. **Tabla `sedes`**: `id`, `codigo` ('CRAI' | 'SEXTA'), `nombre`, `activa`. Seed con CRAI y Sexta.
3. **`asesores.sede_id`** (FK nullable). Mariana, Juliana y Elena quedan asignables desde el panel.
4. **`turnos.sede_id`** (FK nullable, requerido para nuevos turnos).
5. **Tabla `encuestas_satisfaccion`**:
   - `turno_id` (FK único), `asesor_id`, `sede_id`
   - `rating` (1–5 estrellas — experiencia general)
   - `atencion_score`, `tiempo_espera_score`, `proceso_financiero_score`, `recomendaria_score` (1–10)
   - `resolvio_dudas` (boolean), `comentario` (text)
   - `created_at`
6. **RLS**:
   - INSERT público (anon) — el estudiante envía su encuesta sin login.
   - SELECT solo `superadmin`.
   - Asesoras y admins regulares **no ven** satisfacción.
7. **Funciones RPC** (security definer, solo superadmin):
   - `admin_kpis_globales()` — totales, promedios, conversiones del día.
   - `admin_asesoras_resumen()` — fila por asesora con estado, capacidad, atendidos hoy/semana/mes, tiempo prom., ocupación, satisfacción, ranking.
   - `admin_sedes_resumen()` — fila por sede con totales, esperando, tiempos, asesoras activas.
   - `admin_satisfaccion_resumen()` — promedios globales, por asesora, por sede, tendencias 30 días, comentarios recientes.
   - `admin_set_sede_asesora(asesor_id, sede_id)` — asigna sede a una asesora.
8. **`request_turno`** se actualiza para aceptar `p_sede_id` y el ranking de `assign_advisor` prefiere asesoras de la misma sede.

---

## FASE 2 — Selector de sede para el estudiante + encuesta de satisfacción

Frontend del estudiante:

- En el flujo de turno: **selector visual de sede** (cards CRAI / Sexta con icono y descripción). Persistido en `flowStore` y enviado a `request_turno`.
- Cuando el turno cambia a `finalizado` en realtime (`useTurnoLive`), el badge persistente y la `MiTurnoCard` muestran un CTA **"Califica tu experiencia"** que abre la encuesta.
- Componente `EncuestaSatisfaccion`:
  - 1 paso: estrellas globales (1–5) + 4 sliders (1–10) + 1 toggle + comentario opcional.
  - Envío directo a `encuestas_satisfaccion` (anon, política INSERT pública).
  - Confirmación animada de agradecimiento.
- Una sola encuesta por turno (constraint `UNIQUE(turno_id)`).

---

## FASE 3 — Centro de control ejecutivo `/admin`

Ruta `/admin` protegida por `SuperAdminRoute` (verifica `has_role(uid, 'superadmin')`). Si un admin normal accede → redirige a `/dashboard`.

**Layout premium** con `Sidebar` colapsable (shadcn):

- Resumen
- Asesoras
- Sedes
- Satisfacción
- Turnos en vivo
- Configuración

**Resumen ejecutivo** (`/admin`):

- 8 KPIs en cards glassmorphism: estudiantes hoy, atenciones activas, turnos esperando, financiaciones del día, tiempo promedio global, satisfacción promedio, tasa de finalización, firmas pendientes.
- Gráfico de área "Atenciones por hora" (Recharts).
- Gráfico de barras "Atenciones por sede".
- Donut "Distribución por estado de turno".
- Sparkline "Tendencia 7 días".

**Asesoras** (`/admin/asesoras`):

- Tabla premium con cada asesora: avatar + nombre, sede, estado actual (badge animado), horario, pausa, capacidad `X/Y` con progress bar, atendidos hoy/semana/mes, tiempo promedio, ocupación %, satisfacción ⭐, posición en ranking.
- Modal de detalle con historial de actividad y mini-charts.
- Acción: cambiar sede asignada.

**Sedes** (`/admin/sedes`):

- Cards por sede con: turnos hoy, en espera, en atención, finalizados, asesoras activas, tiempo promedio, satisfacción, financiaciones.
- Comparativo lado a lado CRAI vs Sexta con barras horizontales.

**Ranking** (en Resumen y Asesoras):

- Podio top 3 con métricas: satisfacción, tiempo promedio, atendidos.

**Realtime**: suscripción a `turnos`, `asesores` y `encuestas_satisfaccion` para refrescar KPIs y tablas en vivo (con throttle).

---

## FASE 4 — Analytics de satisfacción + pulido

`/admin/satisfaccion`:

- Promedio global con estrella grande animada.
- Tabla por asesora ordenada por satisfacción.
- Tabla por sede.
- Lista de comentarios recientes: filtros positivos/negativos (score ≥ 8 vs ≤ 5).
- Tendencia 30 días (LineChart).
- Distribución de ratings (histograma).

Pulido global:

- Skeletons en todas las tablas y cards.
- Animaciones de entrada (Framer Motion staggered).
- Búsqueda y filtro de fecha en tablas grandes.
- Export CSV (cliente) en tablas de asesoras y satisfacción.

---

## Stack

React + Tailwind + Framer Motion + shadcn + Recharts (ya instalado) + Supabase realtime. Sin nuevas dependencias.

Colores oficiales: `#001550`, `#013084`, `#0699d9` con glassmorphism.

---

## Por dónde empezar

Propongo arrancar por **Fase 1** porque desbloquea todo lo demás (rol superadmin + tabla sedes + encuesta + RPCs). En cuanto la migración esté aprobada, pasamos a Fase 2.

¿Apruebas el plan y arrancamos con la **Fase 1**?
