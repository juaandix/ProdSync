"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner"; 
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { userService } from "@/services/userService";
import { createUserSchema, CreateUserFormData } from "@/schemas/userSchema";
import { getErrorMessage } from "@/lib/errorUtils";

export default function CreateUserForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      role: "USER",
      status: "ACTIVE",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("User created successfully!");
      router.push("/users");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear el usuario.'));
    },
  });

  const onSubmit = async ({ confirmPassword: _, ...data }: CreateUserFormData) => {
    createUserMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1 dark:text-gray-200">Name</label>
          <input
            type="text"
            id="name"
            {...register("name")}
            className={`w-full px-3 py-2 border rounded-md dark:bg-[#1E1E26] dark:text-white/90 ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1 dark:text-gray-200">Username</label>
          <input
            type="text"
            id="username"
            {...register("username")}
            className={`w-full px-3 py-2 border rounded-md dark:bg-[#1E1E26] dark:text-white/90 ${errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
          />
          {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1 dark:text-gray-200">Password</label>
          <input
            type="password"
            id="password"
            {...register("password")}
            className={`w-full px-3 py-2 border rounded-md dark:bg-[#1E1E26] dark:text-white/90 ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
          />
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 dark:text-gray-200">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            {...register("confirmPassword")}
            className={`w-full px-3 py-2 border rounded-md dark:bg-[#1E1E26] dark:text-white/90 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
          />
          {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1 dark:text-gray-200">Email</label>
          <input
            type="email"
            id="email"
            {...register("email")}
            className={`w-full px-3 py-2 border rounded-md dark:bg-[#1E1E26] dark:text-white/90 ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium mb-1 dark:text-gray-200">Role</label>
          <select
            id="role"
            {...register("role")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-[#1E1E26] dark:text-gray-400"
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
            <option value="OPERATOR">Operator</option>
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1 dark:text-gray-200">Status</label>
          <select
            id="status"
            {...register("status")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-[#1E1E26] dark:text-gray-400"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={createUserMutation.isPending}
        className="px-4 py-2 bg-[#1E1E26] text-white rounded-md hover:bg-[#13131a] disabled:opacity-50"
      >
        {createUserMutation.isPending ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}