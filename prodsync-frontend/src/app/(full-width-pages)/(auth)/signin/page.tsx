"use client";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorUtils";
import Image from "next/image";

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [keepSession, setKeepSession] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const toastId = toast.loading("Iniciando sesión...");
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await login({ username: email, password });
      toast.success("Sesión iniciada correctamente.", { id: toastId });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Credenciales incorrectas. Inténtalo de nuevo."), { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-[#1E1E26] flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <Link href="/" className="mb-10 animate-rise">
        <Image
          src="/images/prodsync-sidebar-logo.png"
          alt="ProdSync"
          width={150}
          height={50}
          className="h-auto"
        />
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm bg-[#26262F] rounded-2xl border border-white/8 px-8 py-8 shadow-[0_24px_48px_-24px_rgb(0_0_0/0.6)] animate-rise [animation-delay:90ms]">

        <h1 className="text-lg font-semibold text-white mb-1">Iniciar sesión</h1>
        <p className="text-sm text-white/55 mb-7">Accede a tu cuenta de ProdSync</p>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-white/60 uppercase tracking-wide">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@correo.com"
              required
              className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-white placeholder:text-white/45 focus:outline-none focus:border-brand-400/60 focus:bg-white/8 focus:ring-4 focus:ring-brand-500/15 transition-[border-color,background-color,box-shadow] duration-200"
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wide">
                Contraseña
              </label>
              <Link
                href="/reset-password"
                className="text-xs text-white/55 hover:text-white transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 pr-11 text-sm text-white placeholder:text-white/45 focus:outline-none focus:border-brand-400/60 focus:bg-white/8 focus:ring-4 focus:ring-brand-500/15 transition-[border-color,background-color,box-shadow] duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white/80 transition-colors"
              >
                {showPassword ? (
                  <EyeIcon className="fill-current w-5 h-5" />
                ) : (
                  <EyeCloseIcon className="fill-current w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mantener sesión */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={keepSession}
              onChange={(e) => setKeepSession(e.target.checked)}
              className="w-4 h-4 rounded accent-white cursor-pointer"
            />
            <span className="text-sm text-white/55">Mantener sesión iniciada</span>
          </label>

          {/* Botón */}
          <button
            type="submit"
            className="w-full mt-2 bg-white text-[#1E1E26] rounded-xl py-2.5 text-sm font-semibold hover:bg-white/90 press"
          >
            Iniciar sesión
          </button>

        </form>
      </div>

      <p className="mt-6 text-sm text-white/50 animate-fade [animation-delay:260ms]">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="text-white/60 font-medium hover:text-white transition-colors">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
