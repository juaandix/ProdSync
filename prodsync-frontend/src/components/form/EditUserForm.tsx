
"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { userService } from "@/services/userService";
import { editUserSchema, EditUserFormData } from "@/schemas/userSchema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@/types/models";
import { getErrorMessage } from "@/lib/errorUtils";

export default function EditUserForm({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['users', id],
    queryFn: () => userService.getById(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (user) {
      reset(user);
    }
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: (data: EditUserFormData) => userService.update(id, data),
    onSuccess: (updatedUser: User) => {
      queryClient.setQueryData(['users', id], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("User updated successfully!");
      router.push("/users");
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Error al actualizar el usuario.'));
    },
  });

  const onSubmit = (data: EditUserFormData) => {
    mutation.mutate(data);
  };

  if (isLoading) return (
    <div data-testid="loading-skeleton" className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i}>
          <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 w-24 mb-2" />
          <div className="h-10 rounded-md bg-gray-200 dark:bg-gray-700 w-full" />
        </div>
      ))}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 dark:bg-transparent">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
        <input
          type="text"
          id="name"
          {...register("name")}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-[#1E1E26] dark:text-white/90 ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Username</label>
        <input
          type="text"
          id="username"
          {...register("username")}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-[#1E1E26] dark:text-white/90 ${errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
        />
        {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
        <input
          type="email"
          id="email"
          {...register("email")}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-[#1E1E26] dark:text-white/90 ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
        />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Role</label>
        <select
          id="role"
          {...register("role")}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-[#1E1E26] dark:text-gray-400"
        >
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
          <option value="OPERATOR">Operator</option>
        </select>
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Status</label>
        <select
          id="status"
          {...register("status")}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-[#1E1E26] dark:text-gray-400"
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>
      <button type="submit" disabled={mutation.isPending} className="px-4 py-2 bg-[#1E1E26] text-white rounded-md hover:bg-[#13131a] disabled:opacity-50">
        {mutation.isPending ? "Updating..." : "Update User"}
      </button>
    </form>
  );
}
