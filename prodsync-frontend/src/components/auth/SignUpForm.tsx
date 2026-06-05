"use client";
import Link from "next/link";
import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { getErrorMessage } from "@/lib/errorUtils";
import Label from "@/components/form/Label";

const signUpSchema = z.object({
  fname: z.string().min(2, "Mínimo 2 caracteres"),
  lname: z.string().min(2, "Mínimo 2 caracteres"),
  username: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().min(1, "Obligatorio").email("Email no válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  terms: z.boolean().refine((v) => v === true, {
    message: "Debes aceptar los términos",
  }),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

const inputBase =
  "h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#1E1E26] focus:ring-2 focus:ring-[#1E1E26]/10 transition-colors";
const inputError =
  "h-11 w-full rounded-lg border border-red-400 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-300/20 transition-colors";

const inputClass = (hasError: boolean) => (hasError ? inputError : inputBase);

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fname: "", lname: "", username: "", email: "", password: "", terms: false },
  });

  const onSubmit = async (data: SignUpFormData) => {
    const toastId = toast.loading("Creando cuenta...");
    try {
      await authService.signup({
        username: data.username,
        email: data.email,
        password: data.password,
        nombre: `${data.fname} ${data.lname}`.trim(),
        estado: "ACTIVE",
        role: "USER",
      });
      toast.success("Cuenta creada. Inicia sesión.", { id: toastId });
      router.push("/signin");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Error al crear la cuenta. Inténtalo de nuevo."), { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-[#1E1E26] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8">
        <Image
          src="/images/prodsync-sidebar-logo.png"
          alt="ProdSync"
          width={160}
          height={53}
          className="h-auto"
        />
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Crear cuenta</h1>
        <p className="text-sm text-gray-400 mb-7">Rellena los datos para registrarte</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fname">Nombre</Label>
              <input id="fname" placeholder="Nombre" {...register("fname")} className={inputClass(!!errors.fname)} />
              {errors.fname && <p className="mt-1 text-xs text-red-500">{errors.fname.message}</p>}
            </div>
            <div>
              <Label htmlFor="lname">Apellidos</Label>
              <input id="lname" placeholder="Apellidos" {...register("lname")} className={inputClass(!!errors.lname)} />
              {errors.lname && <p className="mt-1 text-xs text-red-500">{errors.lname.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="username">Usuario</Label>
            <input id="username" placeholder="nombre_usuario" {...register("username")} className={inputClass(!!errors.username)} />
            {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>}
          </div>

          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <input type="email" id="email" placeholder="tu@correo.com" {...register("email")} className={inputClass(!!errors.email)} />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <input
                id="password"
                placeholder="Mínimo 6 caracteres"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className={inputClass(!!errors.password)}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
              >
                {showPassword ? (
                  <EyeIcon className="fill-gray-400" />
                ) : (
                  <EyeCloseIcon className="fill-gray-400" />
                )}
              </span>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div>
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="terms"
                {...register("terms")}
                className="mt-0.5 h-4 w-4 cursor-pointer accent-[#1E1E26]"
              />
              <label htmlFor="terms" className="text-xs text-gray-500 cursor-pointer leading-relaxed">
                Acepto los{" "}
                <span className="text-gray-800 font-medium">Términos y Condiciones</span> y la{" "}
                <span className="text-gray-800 font-medium">Política de Privacidad</span>
              </label>
            </div>
            {errors.terms && <p className="mt-1 text-xs text-red-500">{errors.terms.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#1E1E26] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#2e2e3a] disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>
      </div>

      <p className="mt-5 text-sm text-gray-400">
        ¿Ya tienes cuenta?{" "}
        <Link href="/signin" className="text-gray-700 font-medium hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
