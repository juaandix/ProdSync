"use client";

import React, { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, Trash2 } from "lucide-react";
import { clientService } from "@/services/clientService";
import { getErrorMessage } from "@/lib/errorUtils";
import { useRole } from "@/hooks/useRole";
import ClientLogo from "@/components/ui/avatar/ClientLogo";
import type { Client } from "@/types/models";

const MAX_BYTES = 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

/**
 * Logo grande de la ficha de cliente. ADMIN y OPERATOR pueden subirlo,
 * cambiarlo o quitarlo; el resto solo lo ve.
 */
export default function ClientLogoEditor({ client }: { client: Client }) {
  const { hasPermission } = useRole();
  const canEdit = hasPermission(["ADMIN", "OPERATOR"]);
  const input = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const onSaved = (updated: Client) => {
    queryClient.setQueryData(["client", client.id], updated);
    // Listas y proyectos llevan el cliente anidado con su versión de logo
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  const upload = useMutation({
    mutationFn: (file: File) => clientService.uploadLogo(client.id, file),
    onSuccess: (updated) => {
      onSaved(updated);
      toast.success("Logo actualizado");
    },
    onError: (e) => toast.error(getErrorMessage(e, "No se pudo subir el logo.")),
  });

  const remove = useMutation({
    mutationFn: () => clientService.deleteLogo(client.id),
    onSuccess: (updated) => {
      onSaved(updated);
      toast.success("Logo eliminado");
    },
    onError: (e) => toast.error(getErrorMessage(e, "No se pudo quitar el logo.")),
  });

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!file) return;
    // Comprobación rápida en el navegador; el backend valida de nuevo por la firma del archivo
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Formato no admitido. Usa PNG, JPG o WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("El logo no puede superar 1 MB.");
      return;
    }
    upload.mutate(file);
  };

  const busy = upload.isPending || remove.isPending;

  return (
    <div className="relative shrink-0 group">
      <ClientLogo client={client} size={80} className={busy ? "opacity-50" : ""} />

      {canEdit && (
        <>
          <input ref={input} type="file" accept={ACCEPTED.join(",")} className="hidden" onChange={onPick} />
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            aria-label={client.logoVersion ? "Cambiar logo" : "Subir logo"}
            title={client.logoVersion ? "Cambiar logo" : "Subir logo (PNG, JPG o WebP, máx. 1 MB)"}
            className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-900 shadow-lg ring-2 ring-canvas hover:bg-white/90 press"
          >
            <Camera size={15} />
          </button>
          {client.logoVersion && (
            <button
              type="button"
              onClick={() => remove.mutate()}
              disabled={busy}
              aria-label="Quitar logo"
              title="Quitar logo"
              className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-error-500 text-white shadow-lg ring-2 ring-canvas opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
            >
              <Trash2 size={12} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
