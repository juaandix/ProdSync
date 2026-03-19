"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { clientService } from "@/services/clientService";
import { clientSchema, ClientFormData } from "@/schemas/clientSchema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateClientRequest } from "@/types/dtos";
import { getErrorMessage } from "@/lib/errorUtils";

export default function EditClientForm({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const { data: client, isLoading } = useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientService.getById(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (client) {
      reset(client);
    }
  }, [client, reset]);

  const mutation = useMutation({
    mutationFn: (data: UpdateClientRequest) => clientService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success("Client updated successfully!");
      setTimeout(() => {
        router.push("/clients");
      }, 1500);
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Error al actualizar el cliente.'));
    },
  });

  const onSubmit = (data: ClientFormData) => {
    mutation.mutate(data);
  };

  if (isLoading) return (
    <div data-testid="loading-skeleton" className="animate-pulse space-y-4 p-6 bg-white rounded-lg shadow dark:bg-[#1E1E26]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i}>
            <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 w-24 mb-2" />
            <div className="h-10 rounded-md bg-gray-200 dark:bg-gray-700 w-full" />
          </div>
        ))}
      </div>
    </div>
  );

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
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
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
          <label htmlFor="identification" className="block text-sm font-medium mb-1 dark:text-gray-200">Identification</label>
          <input
            type="text"
            id="identification"
            {...register("identification")}
            className={`w-full px-3 py-2 border rounded-md dark:border-gray-700 dark:bg-[#1E1E26] dark:text-white/90 ${errors.identification ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.identification && <p className="text-xs text-red-500 mt-1">{errors.identification.message}</p>}
        </div>
        <div>
          <label htmlFor="contactPerson" className="block text-sm font-medium mb-1 dark:text-gray-200">Contact Person</label>
          <input
            type="text"
            id="contactPerson"
            {...register("contactPerson")}
            className={`w-full px-3 py-2 border rounded-md dark:border-gray-700 dark:bg-[#1E1E26] dark:text-white/90 ${errors.contactPerson ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.contactPerson && <p className="text-xs text-red-500 mt-1">{errors.contactPerson.message}</p>}
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-1 dark:text-gray-200">Location</label>
          <input
            type="text"
            id="location"
            {...register("location")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-[#1E1E26] dark:text-white/90"
          />
        </div>
        <div>
          <label htmlFor="province" className="block text-sm font-medium mb-1 dark:text-gray-200">Province</label>
          <input
            type="text"
            id="province"
            {...register("province")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-[#1E1E26] dark:text-white/90"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="px-4 py-2 bg-[#E93222] text-white rounded-md hover:bg-[#C72C1F] disabled:opacity-50"
      >
        {mutation.isPending ? "Updating..." : "Update Client"}
      </button>
    </form>
  );
}