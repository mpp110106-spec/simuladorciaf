import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Welcome from "./pages/Welcome";
import Segmentacion from "./pages/Segmentacion";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Turnos from "./pages/Turnos";
import Analytics from "./pages/Analytics";
import FinanciacionPage from "./pages/Financiacion";
import Operacion from "./pages/Operacion";
import Admin from "./pages/Admin";
import AdminOperativo from "./pages/AdminOperativo";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AsesoraRoute from "./components/auth/AsesoraRoute";
import SuperAdminRoute from "./components/auth/SuperAdminRoute";
import PersistentTurnoBadge from "./components/turnos/PersistentTurnoBadge";
import { FlowProvider } from "./stores/flowStore";
import WizardStepper from "./components/wizard/WizardStepper";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" richColors />
        <BrowserRouter>
          <AuthProvider>
            <FlowProvider>
              <WizardStepper />
              <PersistentTurnoBadge />
              <Routes>
              <Route path="/" element={<Segmentacion />} />
              <Route path="/sede" element={<Welcome />} />
              <Route path="/simulador" element={<Index />} />
              <Route path="/financiacion" element={<FinanciacionPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/operacion" element={<AsesoraRoute><Operacion /></AsesoraRoute>} />
              <Route path="/admin" element={<SuperAdminRoute><Admin /></SuperAdminRoute>} />
              <Route path="/admin/operativo" element={<SuperAdminRoute><AdminOperativo /></SuperAdminRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/turnos" element={<ProtectedRoute><Turnos /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
              </Routes>
            </FlowProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
