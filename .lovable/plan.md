# Plan: Plataforma Operativa de Asesoras CIAF

Este es un proyecto grande. Lo divido en **5 fases entregables** para que puedas validar progreso real entre cada una. Te confirmo cada fase antes de pasar a la siguiente.

---

## Estado actual (lo que ya existe)

- Tabla `asesores` con `nombre`, `correo`, `estado`, `hora_inicio`, `hora_fin`, `max_capacidad`, `tiempo_promedio_min`, `is_online`.
- Función `assign_advisor()` que ya filtra por horario, estado disponible, capacidad y carga.
- `request_turno()` asigna automáticamente al crear turno.
- 3 cuentas admin ya reconocidas: `pagos@`, `auxcobranza@`, `aux.cartera1@` (+ `direccion.riesgos@`).
- Dashboard admin, tabla de turnos, panel de financiaciones.

**Lo que falta:** vincular cuentas ↔ asesoras, dashboard operativo *por asesora*, control de tiempos reales, estados extendidos, asignación automática mejorada y experiencia realtime para el estudiante.

---

## FASE 1 — Modelo de datos operativo

Migración SQL:

1. **Vincular cuenta ↔ asesora**: agregar `asesores.user_id uuid` (nullable, único). Insertar/actualizar las 3 asesoras:
   - Mariana Pacheco → `pagos@ciaf.edu.co`
   - Juliana Mejía → `auxcobranza@ciaf.edu.co`
   - Elena Cabrera → `aux.cartera1@ciaf.edu.co`
   - Trigger en `auth.users` que rellene `asesores.user_id` cuando el correo coincida (similar a `handle_new_admin_user`).
2. **Estados extendidos de asesora** (enum `asesor_estado`): `disponible`, `ocupada`, `en_llamada`, `en_pausa`, `almuerzo`, `offline`, `jornada_finalizada`.
3. **Pausas**: `pausa_inicio time`, `pausa_fin time`.
4. **Control de tiempos en `turnos`**: `atencion_inicio timestamptz`, `atencion_fin timestamptz`, `pausado_at timestamptz`, `observaciones text`.
5. **Función `assign_advisor()`** actualizada: solo asesoras en estado `disponible`, online, dentro de horario y fuera de pausa/almuerzo.
6. **Funciones RPC nuevas**:
   - `start_atencion(turno_id)` — marca `en_proceso`, registra `atencion_inicio`, pone asesora en `ocupada`.
   - `finish_atencion(turno_id, observaciones?)` — marca `finalizado`, registra `atencion_fin`, calcula `tiempo_espera`, recalcula `tiempo_promedio_min` de la asesora, libera estado.
   - `set_asesor_estado(estado)` — la asesora cambia su propio estado.
   - `call_next_turno()` — toma el siguiente pendiente asignado a la asesora.
7. **RLS**: cada asesora puede leer/editar sus turnos asignados; admins ven todo.

---

## FASE 2 — Dashboard operativo por asesora

Nueva ruta `/operacion` (protegida, requiere ser asesora vinculada).

- **Header premium**: nombre asesora, estado actual con selector, switch online/offline, horario, próxima pausa.
- **Resumen del día (KPIs)**: atendidos, en espera, en atención, finalizados, tiempo promedio, capacidad `X/10`.
- **Tablero Kanban** con 3 columnas (Esperando · En atención · Finalizados) usando drag-free + animaciones Framer Motion.
- **Cards de turno**: número grande, nombre, carrera/semestre, tipificación, programa académico, valor simulación, badges de prioridad y financiación.
- **Acciones por card**: iniciar, pausar, finalizar, llamar siguiente, agregar observación, ver financiación.
- **Modal de finalización**: observaciones + tiempo automático mostrado.
- **Modal de configuración**: horario, pausa, capacidad máxima.

Estética: `#001550 / #013084 / #0699d9`, glassmorphism, shadows premium, microinteracciones.

---

## FASE 3 — Asignación inteligente + tiempos reales

- `assign_advisor()` mejorada con ranking por `carga_activa ASC, tiempo_acumulado_estimado ASC, tiempo_promedio_min ASC, random()`.
- Al finalizar atención, actualizar `tiempo_promedio_min` con promedio ponderado real (últimas N atenciones).
- Auto-pausa de asignación: si asesora está `en_pausa`, `almuerzo`, `offline`, fuera de horario o al tope de capacidad → excluida.
- Reasignación automática si una asesora pasa a `offline` con turnos pendientes (función `reassign_pending(asesor_id)`).

---

## FASE 4 — Experiencia premium del estudiante en realtime

- Componente `MiTurnoCard` (suscripción Supabase realtime al turno del estudiante):
  - "Tu asesora: **Juliana Mejía**"
  - "Hay 2 personas delante" (solo si > 0)
  - "Tiempo estimado: 14 minutos" (recalculado en vivo)
  - Estado animado: pendiente → llamado → en atención → finalizado.
- Actualizar `PersistentTurnoBadge` esquina superior izquierda con datos vivos (número, asesora, estado), visible en toda la navegación.
- Notificación toast cuando la asesora inicia atención del turno del estudiante.
- En `/financiacion` y `/sede`, mostrar siempre asesora asignada.

---

## FASE 5 — Pulido y realtime global

- Habilitar realtime para `turnos` y `asesores` (`ALTER PUBLICATION supabase_realtime ADD TABLE ...`).
- Hook `useAsesoraActual()` que detecta si el usuario logueado es asesora.
- Redirección automática al login: asesoras → `/operacion`, admins → `/dashboard`.
- Skeletons, animaciones de entrada, badges de estado animados, progress bars de capacidad.
- Sidebar con navegación para asesoras (Operación · Historial · Configuración).

---

## Detalles técnicos clave

```text
asesores
├── user_id (FK auth.users, único)
├── estado (enum asesor_estado)
├── pausa_inicio / pausa_fin
└── (existentes)

turnos
├── atencion_inicio
├── atencion_fin
├── pausado_at
└── observaciones

RPC nuevas
├── start_atencion(turno_id)
├── finish_atencion(turno_id, obs?)
├── set_asesor_estado(estado)
├── call_next_turno()
└── reassign_pending(asesor_id)
```

Stack: React + Tailwind + Framer Motion + shadcn (ya instalados). Sin nuevas dependencias.

---

## ¿Por dónde empiezo?

Sugiero **arrancar por Fase 1 (migración + vincular cuentas)** porque desbloquea todo lo demás. Cuando esté lista y validada, paso a Fase 2 (dashboard operativo), y así sucesivamente.

¿Apruebas el plan y arrancamos con la **Fase 1**?
