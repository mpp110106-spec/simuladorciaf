import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { z } from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import logoCiaf from "@/assets/logo-ciaf-azul.png";

const credSchema = z.object({
  email: z.string().trim().email("Correo inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(100),
});

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const from = (location.state as { from?: string } | null)?.from || "/dashboard";

  useEffect(() => {
    if (!authLoading && user) {
      navigate(isAdmin ? from : "/", { replace: true });
    }
  }, [user, isAdmin, authLoading, from, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error("No pudimos iniciar sesión", { description: error.message });
    else toast.success("Sesión iniciada");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { display_name: name || email.split("@")[0] },
      },
    });
    setLoading(false);
    if (error) toast.error("No pudimos crear la cuenta", { description: error.message });
    else toast.success("Cuenta creada", { description: "Verifica tu correo para iniciar sesión." });
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result.error) {
      setLoading(false);
      toast.error("No pudimos iniciar con Google");
    }
  };

  return (
    <>
      <Helmet>
        <title>Acceso colaboradores CIAF</title>
        <meta name="description" content="Inicia sesión para acceder al panel administrativo de atención CIAF." />
      </Helmet>
      <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-ciaf-blue-light/30 to-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src={logoCiaf} alt="CIAF" className="h-12 mx-auto mb-3" />
            <CardTitle className="text-ciaf-blue">Acceso colaboradores</CardTitle>
            <CardDescription>Ingresa con tu cuenta CIAF para administrar la atención estudiantil.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              className="w-full mb-4"
              onClick={handleGoogle}
              disabled={loading}
            >
              Continuar con Google
            </Button>
            <div className="relative my-4 text-center text-xs text-muted-foreground">
              <span className="bg-card px-2 relative z-10">o con tu correo</span>
              <div className="absolute inset-x-0 top-1/2 border-t" />
            </div>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
                <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-3 mt-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Mail className="w-4 h-4 text-ciaf-blue" /> Correo</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Lock className="w-4 h-4 text-ciaf-blue" /> Contraseña</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                  </div>
                  <Button type="submit" className="w-full bg-ciaf-blue hover:bg-ciaf-blue/90 text-white" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Iniciar sesión"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-3 mt-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><User className="w-4 h-4 text-ciaf-blue" /> Nombre</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Mail className="w-4 h-4 text-ciaf-blue" /> Correo</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Lock className="w-4 h-4 text-ciaf-blue" /> Contraseña</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                  </div>
                  <Button type="submit" className="w-full bg-ciaf-blue hover:bg-ciaf-blue/90 text-white" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear cuenta"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Tu cuenta requerirá rol de administrador asignado por CIAF para acceder al panel.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
            <p className="text-xs text-center text-muted-foreground mt-4">
              <Link to="/" className="hover:text-ciaf-blue">← Volver al inicio</Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default Auth;