"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner"; 
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { clientService } from "@/services/clientService";
import { clientSchema, ClientFormData } from "@/schemas/clientSchema";
import { CreateClientRequest } from "@/types/dtos";
import { getErrorMessage } from "@/lib/errorUtils";

export default function CreateClientForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      email: "",
      identification: "",
      location: "",
      province: "",
      contactPerson: "", // Nuevo campo
    },
  });

  const createClientMutation = useMutation({
    mutationFn: (data: CreateClientRequest) => clientService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success("Client created successfully!");
      router.push("/clients");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear el cliente.'));
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    createClientMutation.mutate(data);
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
          <label htmlFor="identification" className="block text-sm font-medium mb-1 dark:text-gray-200">Identification</label>
          <input
            type="text"
            id="identification"
            {...register("identification")}
            className={`w-full px-3 py-2 border rounded-md dark:bg-[#1E1E26] dark:text-white/90 ${errors.identification ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
          />
          {errors.identification && <p className="text-xs text-red-500 mt-1">{errors.identification.message}</p>}
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-1 dark:text-gray-200">Location</label>
          <input
            type="text"
            id="location"
            {...register("location")}
            className={`w-full px-3 py-2 border rounded-md dark:bg-[#1E1E26] dark:text-white/90 ${errors.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
          />
          {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location.message}</p>}
        </div>
        <div>
          <label htmlFor="province" className="block text-sm font-medium mb-1 dark:text-gray-200">Province</label>
          <input
            type="text"
            id="province"
            {...register("province")}
            className={`w-full px-3 py-2 border rounded-md dark:bg-[#1E1E26] dark:text-white/90 ${errors.province ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
          />
          {errors.province && <p className="text-xs text-red-500 mt-1">{errors.province.message}</p>}
        </div>
        <div>
          <label htmlFor="contactPerson" className="block text-sm font-medium mb-1 dark:text-gray-200">Contact Person</label>
          <input
            type="text"
            id="contactPerson"
            {...register("contactPerson")}
            className={`w-full px-3 py-2 border rounded-md dark:bg-[#1E1E26] dark:text-white/90 ${errors.contactPerson ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
          />
          {errors.contactPerson && <p className="text-xs text-red-500 mt-1">{errors.contactPerson.message}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={createClientMutation.isPending}
        className="px-4 py-2 bg-[#E93222] text-white rounded-md hover:bg-[#C72C1F] disabled:opacity-50"
      >
        {createClientMutation.isPending ? "Creating..." : "Create Client"}
      </button>
    </form>
  );
}