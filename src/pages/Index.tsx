import { Helmet } from "react-helmet-async";
import CreditSimulator from "@/components/CreditSimulator";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Simulador de Créditos CIAF | Calcula tu Plan de Pagos</title>
        <meta 
          name="description" 
          content="Calcula el valor de tu matrícula, cuota inicial y plan de pagos con el simulador de créditos CIAF. Planifica tu financiamiento educativo de forma rápida." 
        />
        <meta name="keywords" content="CIAF, simulador créditos, matrícula, financiamiento educativo, plan de pagos" />
      </Helmet>
      <main>
        <CreditSimulator />
      </main>
    </>
  );
};

export default Index;
