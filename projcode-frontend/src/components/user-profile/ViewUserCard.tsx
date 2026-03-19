"use client";
import React, { useState, useEffect } from "react";
import { User } from "@/types/models";
import { userService } from "@/services/userService";
import UserAnalytics from "@/components/user-profile/UserAnalytics";
import { getErrorMessage } from "@/lib/errorUtils";

export default function ViewUserCard({ id }: { id: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await userService.getById(id);
        setUser(userData);
      } catch (error) {
        setError(getErrorMessage(error, 'Error al cargar los datos del usuario.'));
      }
    };
    fetchUser();
  }, [id]);

  if (error) {
    return <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>;
  }

  if (!user) {
    return (
      <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
        <div className="h-5 rounded bg-gray-200 dark:bg-gray-700 w-24" />
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 flex gap-6 items-center">
          <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 rounded bg-gray-200 dark:bg-gray-700 w-1/3" />
            <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 w-1/4" />
          </div>
        </div>
        <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  // Adapta la estructura de la plantilla al usuario de tu aplicación
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
        Profile
      </h3>
      <div className="space-y-6">
        {/* UserMetaCard Adaptado */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
              <div className="w-20 h-20 flex items-center justify-center rounded-full bg-[#E93222] text-white font-bold text-3xl flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="order-3 xl:order-2">
                <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                  {user.name}
                </h4>
                <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.role}
                  </p>
                  <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* UserInfoCard Adaptado */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Personal Information
            </h4>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Username</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user.username}</p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user.email}</p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Status</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics section */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">
            Rendimiento del Sistema
          </h4>
          <UserAnalytics userId={user.id} />
        </div>
      </div>
    </div>
  );
}