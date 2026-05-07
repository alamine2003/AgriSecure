import React, { useState } from "react"
import client from "../api/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  CheckCircle, PauseCircle, Pencil, Trash2, UserPlus, Search,
  Users, UserCheck, UserX, Phone, Mail, Hash, Shield, Activity, Sparkles
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FloatingInput } from "@/components/ui/floating-input"
import { notify } from "@/lib/notify"

export default function AgentsManagementV3() {
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({
    nin: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
  })
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  })

  const usersQuery = useQuery({
    queryKey: ["users", "agents"],
    queryFn: async () => {
      const res = await client.get("/users/")
      return Array.isArray(res.data) ? res.data : res.data?.results || []
    },
    refetchInterval: 15000,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        email: form.email.trim().toLowerCase(),
        nin: form.nin.trim(),
        role: "agent_agricole",
      }
      const res = await client.post("/users/", payload)
      return res.data
    },
    onSuccess: async (data) => {
      notify.success("Agent créé", `L'agent peut se connecter avec son NIN (${form.nin})`)
      setForm({ nin: "", email: "", first_name: "", last_name: "", phone: "" })
      await usersQuery.refetch()
    },
    onError: (err) => {
      const data = err?.response?.data
      if (data && typeof data === "object") {
        const parts = Object.entries(data).flatMap(([key, value]) => {
          if (Array.isArray(value)) return value.map((v) => `${key}: ${v}`)
          if (typeof value === "string") return [`${key}: ${value}`]
          return []
        })
        notify.error("Erreur", parts.join(" | ") || "Impossible de créer l'agent.")
        return
      }
      notify.error("Erreur", err?.response?.data?.detail || "Impossible de créer l'agent.")
    },
  })

  const activateMutation = useMutation({
    mutationFn: async (userId) => {
      await client.patch(`/users/${userId}/activate/`)
    },
    onSuccess: async () => {
      notify.success("Compte activé", "L'agent peut se connecter.")
      await usersQuery.refetch()
    },
    onError: () => notify.error("Erreur", "Impossible d'activer ce compte."),
  })

  const deactivateMutation = useMutation({
    mutationFn: async (userId) => {
      await client.patch(`/users/${userId}/deactivate/`)
    },
    onSuccess: async () => {
      notify.info("Compte désactivé", "L'agent ne peut plus se connecter.")
      await usersQuery.refetch()
    },
    onError: () => notify.error("Erreur", "Impossible de désactiver ce compte."),
  })

  const deleteMutation = useMutation({
    mutationFn: async (userId) => {
      await client.delete(`/users/${userId}/`)
    },
    onSuccess: async () => {
      notify.success("Compte supprimé", "Le compte a été supprimé.")
      await usersQuery.refetch()
    },
    onError: () => notify.error("Erreur", "Impossible de supprimer ce compte."),
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      await client.patch(`/users/${editingUser.id}/`, editForm)
    },
    onSuccess: async () => {
      notify.success("Mise à jour", "Compte agent mis à jour.")
      setEditingUser(null)
      await usersQuery.refetch()
    },
    onError: (err) => {
      const message =
        err?.response?.data?.first_name?.[0] ||
        err?.response?.data?.last_name?.[0] ||
        err?.response?.data?.phone?.[0] ||
        err?.response?.data?.detail ||
        "Impossible de mettre à jour ce compte."
      notify.error("Erreur", message)
    },
  })

  const users = usersQuery.data || []
  const filteredUsers = users.filter((u) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim().toLowerCase()
    return (
      fullName.includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.nin || "").toLowerCase().includes(q) ||
      (u.phone || "").toLowerCase().includes(q)
    )
  })

  const activeCount = users.filter(u => u.is_active).length
  const inactiveCount = users.filter(u => !u.is_active).length
  const mustChangePasswordCount = users.filter(u => u.must_change_password).length

  const statsCards = [
    { label: "Total Agents", value: users.length, icon: Users, gradient: "from-blue-400 via-blue-500 to-indigo-500" },
    { label: "Actifs", value: activeCount, icon: UserCheck, gradient: "from-green-400 via-green-500 to-emerald-500" },
    { label: "Inactifs", value: inactiveCount, icon: UserX, gradient: "from-gray-400 via-gray-500 to-slate-500" },
    { label: "1ère connexion", value: mustChangePasswordCount, icon: Shield, gradient: "from-yellow-400 via-yellow-500 to-orange-500" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 p-6 space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl blur-lg opacity-50"></div>
            <div className="relative bg-gradient-to-br from-green-500 to-blue-600 p-3 rounded-2xl">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-indigo-900 bg-clip-text text-transparent">
              Gestion des Agents Agricoles
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Pilotez vos équipes avec style
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="group relative">
              <div className={`absolute -inset-1 bg-gradient-to-r ${stat.gradient} rounded-3xl opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500`}></div>
              <Card className="relative bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2 font-medium">{stat.label}</p>
                      <p className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                      <Icon className="w-8 h-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire Création */}
        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl">
          <CardHeader className="border-b-2 border-dashed bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              Créer un Agent
            </CardTitle>
            <CardDescription className="font-medium">
              Mot de passe initial = NIN
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                createMutation.mutate()
              }}
            >
              <FloatingInput
                id="nin"
                label="NIN"
                value={form.nin}
                onChange={(e) => setForm((f) => ({ ...f, nin: e.target.value }))}
                required
                icon={<Hash className="w-4 h-4" />}
              />
              <FloatingInput
                id="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                autoCapitalize="none"
                spellCheck={false}
                icon={<Mail className="w-4 h-4" />}
              />
              <FloatingInput
                id="first_name"
                label="Prénom"
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                required
              />
              <FloatingInput
                id="last_name"
                label="Nom"
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                required
              />
              <FloatingInput
                id="phone"
                label="Téléphone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                icon={<Phone className="w-4 h-4" />}
              />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-white"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Création..." : "Créer l'Agent"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Liste Agents */}
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl">
          <CardHeader className="border-b-2 border-dashed">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Comptes Agents</CardTitle>
                <CardDescription className="font-medium">{filteredUsers.length} agent(s)</CardDescription>
              </div>
              <Badge className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                <Activity className="w-3 h-3 animate-pulse" />
                Live
              </Badge>
            </div>

            {/* Barre de recherche */}
            <div className="relative mt-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, NIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/50 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {usersQuery.isLoading ? (
              <div className="text-center py-12">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-ping opacity-20"></div>
                  <Activity className="relative w-16 h-16 text-blue-600 animate-pulse" />
                </div>
                <p className="text-muted-foreground font-medium">Chargement des agents...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                <p className="text-xl font-bold text-gray-900 mb-2">Aucun agent</p>
                <p className="text-muted-foreground">Créez votre premier agent avec le formulaire</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
                    <Card className="relative border-2 border-gray-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white/90 backdrop-blur-sm">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-3">
                              <h3 className="font-bold text-lg bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                {u.first_name} {u.last_name}
                              </h3>
                              {u.is_active ? (
                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">Actif</Badge>
                              ) : (
                                <Badge variant="outline" className="border-2">Inactif</Badge>
                              )}
                              {u.must_change_password && (
                                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">1ère connexion</Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
                                <Mail className="w-4 h-4 text-purple-600" />
                                <span className="truncate text-gray-800 font-medium">{u.email}</span>
                              </div>
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                                <Hash className="w-4 h-4 text-blue-600" />
                                <span className="font-mono font-bold text-gray-900">{u.nin}</span>
                              </div>
                              {u.phone && (
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
                                  <Phone className="w-4 h-4 text-green-600" />
                                  <span className="text-gray-800 font-medium">{u.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingUser(u)
                                setEditForm({
                                  first_name: u.first_name || "",
                                  last_name: u.last_name || "",
                                  phone: u.phone || "",
                                })
                              }}
                              className="border-2 hover:scale-110 transition-transform"
                              title="Modifier"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>

                            {u.is_active ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => deactivateMutation.mutate(u.id)}
                                disabled={deactivateMutation.isPending}
                                className="border-2 hover:scale-110 transition-transform"
                                title="Désactiver"
                              >
                                <PauseCircle className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => activateMutation.mutate(u.id)}
                                disabled={activateMutation.isPending}
                                className="border-2 hover:scale-110 transition-transform"
                                title="Activer"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}

                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (window.confirm(`Supprimer ${u.first_name} ${u.last_name}?`)) {
                                  deleteMutation.mutate(u.id)
                                }
                              }}
                              disabled={deleteMutation.isPending}
                              className="hover:scale-110 transition-transform"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Edition */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-lg animate-in fade-in duration-300">
          <Card className="max-w-md w-full bg-white/95 backdrop-blur-xl border-2 border-white/20 shadow-2xl animate-in zoom-in-95 duration-300">
            <CardHeader className="border-b-2 border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" />
                Modifier l'Agent
              </CardTitle>
              <CardDescription className="font-medium">{editingUser.email}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  updateMutation.mutate()
                }}
              >
                <FloatingInput
                  id="edit_first_name"
                  label="Prénom"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, first_name: e.target.value }))}
                  required
                />
                <FloatingInput
                  id="edit_last_name"
                  label="Nom"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, last_name: e.target.value }))}
                  required
                />
                <FloatingInput
                  id="edit_phone"
                  label="Téléphone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  icon={<Phone className="w-4 h-4" />}
                />

                <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 shadow-lg"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-2"
                    onClick={() => setEditingUser(null)}
                    disabled={updateMutation.isPending}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(243, 244, 246, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #6366f1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #4f46e5);
        }
      `}</style>
    </div>
  )
}
