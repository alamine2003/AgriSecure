import React, { useState } from "react"
import client from "../api/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  CheckCircle, PauseCircle, Pencil, Trash2, UserPlus, Search,
  Users, UserCheck, UserX, Phone, Mail, Hash, Shield, Activity
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FloatingInput } from "@/components/ui/floating-input"
import { notify } from "@/lib/notify"

export default function AgentsManagementV2() {
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
    refetchInterval: 15000, // Refresh toutes les 15s
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
    { label: "Total Agents", value: users.length, icon: Users, gradient: "from-blue-500 to-blue-600", bg: "bg-blue-50" },
    { label: "Actifs", value: activeCount, icon: UserCheck, gradient: "from-green-500 to-green-600", bg: "bg-green-50" },
    { label: "Inactifs", value: inactiveCount, icon: UserX, gradient: "from-gray-500 to-gray-600", bg: "bg-gray-50" },
    { label: "1ère connexion", value: mustChangePasswordCount, icon: Shield, gradient: "from-yellow-500 to-yellow-600", bg: "bg-yellow-50" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Gestion des Agents Agricoles
        </h1>
        <p className="text-muted-foreground mt-1">
          Créer, modifier et gérer les comptes agents
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className={`border-0 shadow-lg ${stat.bg} hover:shadow-xl transition-all duration-300`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-4xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg`}>
                    <Icon className="w-7 h-7" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire Création */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-600" />
              Créer un Agent
            </CardTitle>
            <CardDescription>
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
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Création..." : "Créer l'Agent"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Liste Agents */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Comptes Agents</CardTitle>
                <CardDescription>{filteredUsers.length} agent(s)</CardDescription>
              </div>
              <Badge variant="secondary" className="flex items-center gap-2">
                <Activity className="w-3 h-3 animate-pulse" />
                Live
              </Badge>
            </div>

            {/* Barre de recherche */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, NIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {usersQuery.isLoading ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto mb-4 animate-pulse text-blue-600" />
                <p className="text-muted-foreground">Chargement des agents...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-900 mb-2">Aucun agent</p>
                <p className="text-muted-foreground">Créez votre premier agent avec le formulaire</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {filteredUsers.map((u) => (
                  <Card key={u.id} className="border shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">
                              {u.first_name} {u.last_name}
                            </h3>
                            {u.is_active ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">Actif</Badge>
                            ) : (
                              <Badge variant="outline">Inactif</Badge>
                            )}
                            {u.must_change_password && (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">1ère connexion</Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              <span className="truncate">{u.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Hash className="w-4 h-4" />
                              <span className="font-mono">{u.nin}</span>
                            </div>
                            {u.phone && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="w-4 h-4" />
                                <span>{u.phone}</span>
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
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Edition */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="max-w-md w-full border-0 shadow-2xl">
            <CardHeader className="border-b">
              <CardTitle>Modifier l'Agent</CardTitle>
              <CardDescription>{editingUser.email}</CardDescription>
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

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
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
    </div>
  )
}
