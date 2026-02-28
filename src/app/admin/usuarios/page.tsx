"use client";

import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, User } from "lucide-react";
import { getUsersAction, deleteUserAction } from "@/actions/userActions";
import { UserModal } from "@/features/admin/components/UserModal";
import { Role } from "@prisma/client";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  createdAt: Date;
  _count: {
    orders: number;
  };
}

const roleColors: Record<Role, string> = {
  ADMIN: "bg-purple-500/20 text-purple-400 border-purple-500",
  MOZO: "bg-blue-500/20 text-blue-400 border-blue-500",
  BARMAN: "bg-orange-500/20 text-orange-400 border-orange-500",
  COCINERO: "bg-red-500/20 text-red-400 border-red-500",
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filterRole, setFilterRole] = useState<string>("TODOS");

  const loadUsers = async () => {
    setLoading(true);
    const result = await getUsersAction();
    if (result.success) {
      setUsers(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (userId: string) => {
    if (!confirm("¿Eliminar este usuario?")) return;

    const result = await deleteUserAction(userId);
    if (result.success) {
      loadUsers();
    } else {
      alert(result.error);
    }
  };

  const filteredUsers =
    filterRole === "TODOS" ? users : users.filter((u) => u.role === filterRole);

  const roles = ["TODOS", "ADMIN", "MOZO", "BARMAN", "COCINERO"];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter">
            USUARIOS
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
            Gestiona el equipo del sistema
          </p>
        </div>

        <button
          onClick={() => {
            setEditingUser(null);
            setModalOpen(true);
          }}
          className="glass-card px-6 py-3 flex items-center gap-3 hover:bg-purple-600 hover:border-purple-600 transition-all"
        >
          <Plus size={20} />
          <span className="font-bold text-sm">NUEVO USUARIO</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {roles
          .filter((r) => r !== "TODOS")
          .map((role) => (
            <div key={role} className="glass-card p-4 border-2 border-white/10">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {role}S
              </p>
              <p className="text-3xl font-black mt-2">
                {users.filter((u) => u.role === role).length}
              </p>
            </div>
          ))}
      </div>

      {/* Role Filter */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Filtrar Rol:
        </span>
        <div className="flex gap-2">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                filterRole === role
                  ? "bg-purple-600 text-white"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                Usuario
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                Email
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                Rol
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                Pedidos
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  Cargando...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  No hay usuarios
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/10 p-2 rounded-lg">
                        <User size={20} />
                      </div>
                      <span className="font-bold">
                        {user.name || "Sin nombre"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {user.email || "Sin email"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold border ${roleColors[user.role]}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {user._count.orders}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setModalOpen(true);
                        }}
                        className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        user={editingUser}
        onSuccess={loadUsers}
      />
    </div>
  );
}
