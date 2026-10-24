"use client";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
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

// El aspecto de los campos lo da `form-glass` (AuthShell); esta clase solo marca el error
const inputClass = (hasError: boolean) => (hasError ? "border-red-500" : "");

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
    <AuthShell
      title="Crear cuenta"
      subtitle="Únete a tu equipo en ProdSync"
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/signin" className="font-medium text-white hover:text-brand-300 transition-colors">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="fname">Nombre</Label>
            <input id="fname" autoComplete="given-name" placeholder="Nombre" {...register("fname")} className={inputClass(!!errors.fname)} />
            {errors.fname && <p className="mt-1 text-xs text-red-500">{errors.fname.message}</p>}
          </div>
          <div>
            <Label htmlFor="lname">Apellidos</Label>
            <input id="lname" autoComplete="family-name" placeholder="Apellidos" {...register("lname")} className={inputClass(!!errors.lname)} />
            {errors.lname && <p className="mt-1 text-xs text-red-500">{errors.lname.message}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="username">Usuario</Label>
          <input id="username" autoComplete="username" placeholder="nombre_usuario" {...register("username")} className={inputClass(!!errors.username)} />
          {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>}
        </div>

        <div>
          <Label htmlFor="email">Correo electrónico</Label>
          <input type="email" id="email" autoComplete="email" placeholder="tu@correo.com" {...register("email")} className={inputClass(!!errors.email)} />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <input
              id="password"
              placeholder="Mínimo 6 caracteres"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...register("password")}
              className={inputClass(!!errors.password)}
              style={{ paddingRight: "2.75rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="terms" style={{ alignItems: "flex-start" }}>
            <input type="checkbox" id="terms" {...register("terms")} className="mt-0.5 h-4 w-4 cursor-pointer accent-brand-500" />
            <span className="text-xs leading-relaxed text-gray-400">
              Acepto los <span className="font-medium text-gray-200">Términos y Condiciones</span> y la{" "}
              <span className="font-medium text-gray-200">Política de Privacidad</span>
            </span>
          </label>
          {errors.terms && <p className="mt-1 text-xs text-red-500">{errors.terms.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>
    </AuthShell>
  );
}
