'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [savingInfo, setSavingInfo] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user) return null;

  const ROLE_LABEL: Record<string, string> = {
    ADMIN: 'Administrador',
    OPERATOR: 'Operador',
    USER: 'Usuario',
  };

  const inputClass = "w-full h-11 rounded-xl bg-white/[0.05] border border-white/10 px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all";
  const labelClass = "block text-xs font-medium text-white/50 uppercase tracking-wide mb-1.5";

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('El nombre no puede estar vacío.');
    setSavingInfo(true);
    try {
      await apiClient.put(`/usuarios/${user.id}`, {
        nombre: name, username, email, password: currentPassword || '',
      });
      toast.success('Perfil actualizado correctamente.');
    } catch {
      toast.error('Error al actualizar el perfil.');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) return toast.error('Introduce tu contraseña actual.');
    if (newPassword.length < 6) return toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
    if (newPassword !== confirmPassword) return toast.error('Las contraseñas no coinciden.');
    setSavingPassword(true);
    try {
      await apiClient.put(`/usuarios/${user.id}`, {
        nombre: name, username, email, password: newPassword,
      });
      toast.success('Contraseña actualizada correctamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Error al cambiar la contraseña. Verifica la contraseña actual.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/30 to-theme-purple-500/30 border border-brand-500/20 text-brand-400 font-bold text-2xl shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">{user.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-400">{user.email}</span>
            <span className="text-gray-600">·</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400">
              {ROLE_LABEL[user.role] ?? user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Información personal */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={16} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-white">Información personal</h2>
        </div>
        <form onSubmit={handleSaveInfo} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre completo</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Usuario</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="nombre_usuario"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Contraseña actual (requerida para guardar)</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className={`${inputClass} pr-11`}
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingInfo}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#1E1E26] rounded-xl text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors"
            >
              <Save size={15} />
              {savingInfo ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>

      {/* Cambiar contraseña */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={16} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-white">Cambiar contraseña</h2>
        </div>
        <form onSubmit={handleSavePassword} className="space-y-4">
          <div>
            <label className={labelClass}>Contraseña actual</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className={`${inputClass} pr-11`}
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className={`${inputClass} pr-11`}
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className={inputClass}
              />
            </div>
          </div>

          {/* Indicador de fortaleza */}
          {newPassword && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                    newPassword.length >= i * 3
                      ? newPassword.length >= 12 ? 'bg-emerald-500'
                        : newPassword.length >= 8 ? 'bg-amber-400'
                        : 'bg-red-500'
                      : 'bg-white/10'
                  }`} />
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {newPassword.length < 6 ? 'Muy corta' : newPassword.length < 8 ? 'Débil' : newPassword.length < 12 ? 'Aceptable' : 'Fuerte'}
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#1E1E26] rounded-xl text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors"
            >
              <Lock size={15} />
              {savingPassword ? 'Actualizando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
