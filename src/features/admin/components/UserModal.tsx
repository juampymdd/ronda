"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
} from "@/actions/userActions";
import { Role } from "@prisma/client";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSuccess: () => void;
}

const ROLES: Role[] = ["ADMIN", "MOZO", "BARMAN", "COCINERO"];

export function UserModal({ isOpen, onClose, user, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "MOZO" as Role,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "",
        role: user.role,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "MOZO",
      });
    }
    setErrorMsg("");
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      let result;
      if (user) {
        // Update existing user
        const updateData: any = {
          id: user.id,
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };

        // Only include password if it was changed
        if (formData.password) {
          updateData.password = formData.password;
        }

        result = await updateUserAction(updateData);
      } else {
        // Create new user
        if (!formData.password) {
          setErrorMsg("La contraseña es requerida");
          setIsLoading(false);
          return;
        }
        result = await createUserAction(formData);
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(result.error || "Error saving user");
      }
    } catch (error) {
      setErrorMsg("Unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    if (!confirm(`¿Eliminar usuario ${user.name}?`)) return;

    setIsLoading(true);
    setErrorMsg("");

    try {
      const result = await deleteUserAction(user.id);
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(result.error || "Error deleting user");
      }
    } catch (error) {
      setErrorMsg("Unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-black italic">
            {user ? "EDITAR USUARIO" : "NUEVO USUARIO"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Nombre
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Contraseña {user && "(dejar vacío para no cambiar)"}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-purple-500 transition-colors"
              required={!user}
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Rol
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as Role })
              }
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-purple-500 transition-colors"
              required
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {user && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 bg-red-500/10 border border-red-500 text-red-500 px-6 py-3 rounded-lg font-black uppercase tracking-wider hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-black uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {isLoading ? "Guardando..." : user ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
