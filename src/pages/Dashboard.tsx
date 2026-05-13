import { Helmet } from "react-helmet-async";
import AdminShell from "@/components/layout/AdminShell";
import KpiCards from "@/components/dashboard/KpiCards";
import Charts from "@/components/dashboard/Charts";
import TurnosTable from "@/components/dashboard/TurnosTable";
import { useTurnos } from "@/hooks/useTurnos";
import { useAnalytics } from "@/hooks/useAnalytics";
import { usePageView } from "@/hooks/useTracking";

const Dashboard = () => {
  usePageView("dashboard_visitado");
  const { turnos, loading, updateEstado } = useTurnos();
  const { events } = useAnalytics();

  return (
    <>
      <Helmet>
        <title>Dashboard | Atención CIAF</title>
        <meta name="description" content="Dashboard administrativo de turnos y atención estudiantil CIAF en tiempo real." />
      </Helmet>
      <AdminShell title="Dashboard de atención" subtitle="Turnos y métricas en tiempo real">
        <div className="space-y-6">
          <KpiCards turnos={turnos} events={events} />
          <Charts turnos={turnos} />
          <TurnosTable turnos={turnos} loading={loading} onChangeEstado={updateEstado} />
        </div>
      </AdminShell>
    </>
  );
};

export default Dashboard;