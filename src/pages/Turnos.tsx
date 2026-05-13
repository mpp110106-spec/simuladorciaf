import { Helmet } from "react-helmet-async";
import AdminShell from "@/components/layout/AdminShell";
import TurnosTable from "@/components/dashboard/TurnosTable";
import { useTurnos } from "@/hooks/useTurnos";
import { usePageView } from "@/hooks/useTracking";

const Turnos = () => {
  usePageView("turnos_visitado");
  const { turnos, loading, updateEstado } = useTurnos();
  return (
    <>
      <Helmet>
        <title>Turnos | Atención CIAF</title>
      </Helmet>
      <AdminShell title="Gestión de turnos" subtitle="Filtra, busca y actualiza el estado de cada turno">
        <TurnosTable turnos={turnos} loading={loading} onChangeEstado={updateEstado} />
      </AdminShell>
    </>
  );
};

export default Turnos;