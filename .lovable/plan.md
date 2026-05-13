# Plan: Plataforma de atención estudiantil CIAF

Conservo 100% el diseño actual del simulador (colores, tipografías, componentes, layout, branding). Solo **extiendo** la app con nuevas secciones y rutas que reutilizan los mismos tokens y componentes shadcn/Tailwind ya en uso.

## 1. Backend — Lovable Cloud

Activar Lovable Cloud (Supabase administrado, sin cuenta externa) y crear:

- **turnos**: id, nombre, telefono, correo, tipificacion, estado (`pendiente|en_proceso|finalizado|cancelado`), prioridad (`alta|media|baja`), simulacion_valor, asesor_id, tiempo_espera, created_at, updated_at.
- **analytics**: id, evento, pagina, metadata jsonb, dispositivo, navegador, sistema_operativo, session_id, created_at.
- **asesores**: id, nombre, correo unique, estado, created_at.
- FK `turnos.asesor_id → asesores.id`.
- Trigger `updated_at` y trigger que asigna `prioridad` según `tipificacion` (Financiación→alta, Consultas→media, Otros→baja).
- **RLS**: insert público en `turnos` y `analytics` (la app aún no tiene auth de admin); select restringido. Para el dashboard administrativo, lectura pública temporal con nota clara para endurecer cuando se agregue auth (puedo dejarlo abierto ahora o pedirte que confirmes).
- Realtime habilitado en `turnos`.

## 2. Arquitectura frontend

Añadir (sin remover nada):

```text
src/
├── components/
│   ├── turnos/TurnoForm.tsx        # integrado bajo el simulador
│   ├── dashboard/{KpiCards,TurnosTable,Charts,Filters}.tsx
│   └── layout/AdminShell.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Turnos.tsx
│   └── Analytics.tsx
├── hooks/{useTurnos,useAnalytics,useRealtime,useTracking}.ts
├── services/{turnosService,analyticsService}.ts
├── lib/{validations,formatters,constants}.ts
└── types/{turno,analytics}.ts
```

Cliente Supabase: se usa el auto-generado en `src/integrations/supabase/client.ts` (lo crea Cloud). No hardcodeo claves.

## 3. Funcionalidad #1 — Solicita tu turno

- Sección nueva debajo del resultado del simulador, usando `Card`, `Input`, `Button`, `Select` y tokens existentes (mismos azules CIAF, mismas sombras y radios).
- React Hook Form + Zod: nombre ≥3, teléfono ≥10 dígitos, correo válido, tipificación obligatoria.
- Estados loading/disabled, errores inline, toast (sonner) de éxito/error.
- Al enviar: insert en `turnos` con `simulacion_valor` tomado del simulador actual (sin tocar sus cálculos, solo leyendo el total).

## 4. Funcionalidad #2 — Dashboard `/dashboard`

- Ruta nueva en `App.tsx`, navegable desde un enlace discreto en el footer del simulador (sin alterar layout).
- Reutiliza `Card`, `Table`, `Badge`, `Tabs` ya presentes.
- **KPIs**: total, pendientes, en_proceso, finalizados, por tipificación, tasa conversión (turnos/visitas), tiempo promedio, turnos/hora, turnos/día.
- **Recharts**: barras (turnos por día), pie (tipificación), línea (tendencia 14 días), heatmap por hora/día (grid con `div`s coloreados con tokens).
- **Tabla**: filtros (estado, tipificación, fecha), búsqueda (nombre/correo/teléfono), sorting, paginación, badges de estado/prioridad, cambio de estado inline vía `Select`.
- Suscripción realtime: `useRealtime('turnos')` actualiza cache local en cambios INSERT/UPDATE.

## 5. Funcionalidad #3 — Analytics

- `useTracking()` registra automáticamente: `visita_app`, `simulacion_realizada` (al calcular), `turno_creado`, `dashboard_visitado`. Captura device/browser/OS via `navigator.userAgent` y `session_id` en `sessionStorage`.
- Página `/analytics`: usuarios diarios, conversión, simulaciones, solicitudes/día, funnel (visita→simulación→turno), dispositivos, páginas, horas pico. Todo con Recharts y tokens CIAF.

## 6. UX, performance, responsive

- Skeleton loaders (`Skeleton`), empty states, toasts sonner, transiciones suaves Tailwind.
- `React.memo`, `useMemo` en agregados, queries paginadas.
- Mobile-first; tablas con scroll horizontal en móvil; KPIs en grid responsive.

## 7. Lo que NO toco

- `CreditSimulator.tsx`: solo añado al final un `<TurnoForm simulacionValor={...} />`. No cambio cálculos, jornadas, validaciones, ni estilos existentes.
- Branding, colores, tipografía, navbar, layout principal: intactos.

## Detalles técnicos

- Migración SQL única con tablas + enums informales (text + check) + triggers + RLS + publication realtime.
- Servicios tipados con tipos generados por Cloud (`Database['public']['Tables']`).
- Sin Redux/MUI/Chakra/Bootstrap/Firebase.
- Sin `.env` manual: Cloud inyecta `VITE_SUPABASE_*` automáticamente.

## Confirmaciones rápidas antes de construir

1. ¿Activo **Lovable Cloud** ahora? (necesario para Supabase, realtime y RLS).
2. El `/dashboard` quedará **accesible sin login** en esta primera fase (para que puedas usarlo ya). Cuando quieras, agregamos auth + roles. ¿OK?
3. ¿El enlace al dashboard lo pongo discreto en el footer del simulador, o prefieres que solo sea accesible vía URL directa `/dashboard`?
