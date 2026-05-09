"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

import { userService } from "@/services/userService";
import { userSchema, UserFormData } from "@/schemas/userSchema";
import { getErrorMessage } from "@/lib/errorUtils";

const editUserSchema = userSchema.partial({ password: true });

type EditUserFormData = Omit<UserFormData, 'password'> & { password?: string };

export default function EditUserForm({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  const { data: user, isLoading, isError } = useQuery<EditUserFormData>({
    queryKey: ['user', id],
    queryFn: () => userService.getById(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (user) {
      reset(user); // Precargar datos
    }
  }, [user, reset]);

  const updateUserMutation = useMutation({
    mutationFn: (data: EditUserFormData) => {
      // The mapToBackend function in userService handles whether to include the password.
      return userService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("User updated successfully!");
      router.push("/users");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar el usuario.'));
    },
  });

  const onSubmit = async (data: EditUserFormData) => {
    updateUserMutation.mutate(data);
  };

  if (isLoading) return <div className="p-5 text-center">Loading user data...</div>;
  if (isError) return <div className="p-5 text-center text-red-500">Error loading user data.</div>;
  if (!user) return <div className="p-5 text-center">User not found.</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 bg-white rounded-lg shadow dark:bg-[#1E1E26]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1 dark:text-gray-200">Name</label>
          <input
            type="text"
            id="name"
            {...register("name")}
            className={`w-full px-3 py-2 border rounded-md dark:border-gray-700 dark:bg-[#1E1E26] dark:text-white/90 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.name && <p data-testid="name-error" className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1 dark:text-gray-200">Username</label>
          <input
            type="text"
            id="username"
            {...register("username")}
            className={`w-full px-3 py-2 border rounded-md dark:border-gray-700 dark:bg-[#1E1E26] dark:text-white/90 ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.username && <p data-testid="username-error" className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1 dark:text-gray-200">Email</label>
          <input
            type="email"
            id="email"
            {...register("email")}
            className={`w-full px-3 py-2 border rounded-md dark:border-gray-700 dark:bg-[#1E1E26] dark:text-white/90 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
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
        disabled={updateUserMutation.isPending}
        className="px-4 py-2 bg-[#1E1E26] text-white rounded-md hover:bg-[#13131a] disabled:opacity-50"
      >
        {updateUserMutation.isPending ? "Updating..." : "Update User"}
      </button>
    </form>
  );
}
