import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function AsesoraRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [check, setCheck] = useState<"loading" | "ok" | "no">("loading");

  useEffect(() => {
    if (loading) return;
    if (!user) { setCheck("no"); return; }
    supabase.from("asesores").select("id").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setCheck(data ? "ok" : "no"));
  }, [user, loading]);

  if (loading || check === "loading") {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#013084]" /></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (check === "no") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}