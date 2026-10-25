"use client";
import Link from "next/link";
import React, { useState } from "react";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorUtils";
import AuthShell from "@/components/auth/AuthShell";

// Cuenta de demostración que crea el seed (ver docker-compose.yml)
const DEMO = { email: "admin@test.com", password: "password123" };

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSession, setKeepSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading("Iniciando sesión…");
    try {
      await login({ username: email, password }, keepSession);
      toast.success("Sesión iniciada.", { id: toastId });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Credenciales incorrectas. Inténtalo de nuevo."), { id: toastId });
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Accede a tu espacio de trabajo"
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link href="/signup" className="font-medium text-white hover:text-brand-300 transition-colors">
            Regístrate
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password">Contraseña</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: "2.75rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <label>
          <input type="checkbox" checked={keepSession} onChange={(e) => setKeepSession(e.target.checked)} className="h-4 w-4 accent-brand-500" />
          Mantener sesión iniciada
        </label>

        <button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Entrando…" : "Iniciar sesión"}
        </button>

        <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-gray-500" aria-hidden>
          <span className="h-px flex-1 bg-white/[0.07]" />o<span className="h-px flex-1 bg-white/[0.07]" />
        </div>

        <button
          type="button"
          onClick={() => { setEmail(DEMO.email); setPassword(DEMO.password); }}
          className="w-full flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-gray-200 bg-white/[0.05] ring-1 ring-inset ring-white/[0.09] hover:bg-white/[0.09] hover:text-white press"
        >
          <Sparkles size={15} className="text-brand-300" /> Usar cuenta demo
        </button>
        <p className="text-center text-xs text-gray-500">Rellena los datos del administrador de prueba.</p>
      </form>
    </AuthShell>
  );
}
