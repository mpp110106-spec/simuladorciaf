import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Permite acceso a asesoras, administradores o superadministradores.
 */
export default function StaffRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, isSuperAdmin } = useAuth();
  const [isAsesora, setIsAsesora] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { setIsAsesora(false); return; }
    supabase
      .from("asesores")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setIsAsesora(!!data));
  }, [user, loading]);

  if (loading || isAsesora === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#013084]" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAsesora && !isAdmin && !isSuperAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}