import React, { useState } from "react"
import client from "../api/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  CheckCircle, PauseCircle, Pencil, Trash2, UserPlus, Search,
  Users, UserCheck, UserX, Phone, Mail, Hash, Shield, Activity, Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { FloatingInput } from "@/components/ui/floating-input"
import { PhoneInputSenegal } from "@/components/ui/phone-input-senegal"
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
      notify.success("Agent cree", `L'agent peut se connecter avec son NIN (${form.nin})`)
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
        notify.error("Erreur", parts.join(" | ") || "Impossible de creer l'agent.")
        return
      }
      notify.error("Erreur", err?.response?.data?.detail || "Impossible de creer l'agent.")
    },
  })

  const activateMutation = useMutation({
    mutationFn: async (userId) => {
      await client.patch(`/users/${userId}/activate/`)
    },
    onSuccess: async () => {
      notify.success("Compte active", "L'agent peut se connecter.")
      await usersQuery.refetch()
    },
    onError: () => notify.error("Erreur", "Impossible d'activer ce compte."),
  })

  const deactivateMutation = useMutation({
    mutationFn: async (userId) => {
      await client.patch(`/users/${userId}/deactivate/`)
    },
    onSuccess: async () => {
      notify.info("Compte desactive", "L'agent ne peut plus se connecter.")
      await usersQuery.refetch()
    },
    onError: () => notify.error("Erreur", "Impossible de desactiver ce compte."),
  })

  const deleteMutation = useMutation({
    mutationFn: async (userId) => {
      await client.delete(`/users/${userId}/`)
    },
    onSuccess: async () => {
      notify.success("Compte supprime", "Le compte a ete supprime.")
      await usersQuery.refetch()
    },
    onError: () => notify.error("Erreur", "Impossible de supprimer ce compte."),
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      await client.patch(`/users/${editingUser.id}/`, editForm)
    },
    onSuccess: async () => {
      notify.success("Mise a jour", "Compte agent mis a jour.")
      setEditingUser(null)
      await usersQuery.refetch()
    },
    onError: (err) => {
      const message =
        err?.response?.data?.first_name?.[0] ||
        err?.response?.data?.last_name?.[0] ||
        err?.response?.data?.phone?.[0] ||
        err?.response?.data?.detail ||
        "Impossible de mettre a jour ce compte."
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
    { label: "Total Agents", value: users.length, icon: Users, from: "from-sky-500", to: "to-blue-600", shadow: "shadow-sky-500/20" },
    { label: "Actifs", value: activeCount, icon: UserCheck, from: "from-amber-500", to: "to-orange-600", shadow: "shadow-amber-500/20" },
    { label: "Inactifs", value: inactiveCount, icon: UserX, from: "from-violet-500", to: "to-purple-600", shadow: "shadow-violet-500/20" },
    { label: "1ere connexion", value: mustChangePasswordCount, icon: Shield, from: "from-amber-500", to: "to-orange-500", shadow: "shadow-amber-500/20" },
  ]

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.07] via-card to-card" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Gestion des Agents Agricoles
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Pilotez vos equipes avec style
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-card rounded-2xl border border-border/50 p-5 hover:border-primary/20 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-medium">{stat.label}</p>
                  <p className="text-4xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.from} ${stat.to} flex items-center justify-center shadow-lg ${stat.shadow}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire Creation */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="p-5 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Creer un Agent</h2>
                <p className="text-sm text-muted-foreground">Mot de passe initial = NIN</p>
              </div>
            </div>
          </div>
          <div className="p-5">
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
                label="Prenom"
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
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Telephone
                </label>
                <PhoneInputSenegal
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-orange-600 hover:to-teal-700 shadow-lg shadow-amber-500/20 text-white transition-all duration-300"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creation..." : "Creer l'Agent"}
              </Button>
            </form>
          </div>
        </div>

        {/* Liste Agents */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="p-5 border-b border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Comptes Agents</h2>
                <p className="text-sm text-muted-foreground">{filteredUsers.length} agent(s)</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                <Activity className="w-3 h-3 animate-pulse" />
                Live
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, NIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          <div className="p-5">
            {usersQuery.isLoading ? (
              <div className="text-center py-12">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 animate-ping opacity-20"></div>
                  <Activity className="relative w-16 h-16 text-primary animate-pulse" />
                </div>
                <p className="text-muted-foreground font-medium">Chargement des agents...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-xl font-bold text-foreground mb-2">Aucun agent</p>
                <p className="text-muted-foreground">Creez votre premier agent avec le formulaire</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="bg-card rounded-2xl border border-border/50 p-5 hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <h3 className="font-bold text-lg text-foreground">
                            {u.first_name} {u.last_name}
                          </h3>
                          {u.is_active ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">
                              Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                              Inactif
                            </span>
                          )}
                          {u.must_change_password && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">
                              1ere connexion
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-500/10">
                            <Mail className="w-4 h-4 text-violet-400" />
                            <span className="truncate text-foreground">{u.email}</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-sky-500/10">
                            <Hash className="w-4 h-4 text-sky-400" />
                            <span className="font-mono font-bold text-foreground">{u.nin}</span>
                          </div>
                          {u.phone && (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10">
                              <Phone className="w-4 h-4 text-amber-400" />
                              <span className="text-foreground">{u.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUser(u)
                            setEditForm({
                              first_name: u.first_name || "",
                              last_name: u.last_name || "",
                              phone: u.phone || "",
                            })
                          }}
                          className="w-9 h-9 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {u.is_active ? (
                          <button
                            type="button"
                            onClick={() => deactivateMutation.mutate(u.id)}
                            disabled={deactivateMutation.isPending}
                            className="w-9 h-9 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground hover:text-amber-400 hover:border-amber-400/30 transition-all"
                            title="Desactiver"
                          >
                            <PauseCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => activateMutation.mutate(u.id)}
                            disabled={activateMutation.isPending}
                            className="w-9 h-9 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground hover:text-amber-400 hover:border-amber-400/30 transition-all"
                            title="Activer"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Supprimer ${u.first_name} ${u.last_name}?`)) {
                              deleteMutation.mutate(u.id)
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Edition */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                  <Pencil className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Modifier l'Agent</h2>
                  <p className="text-sm text-muted-foreground">{editingUser.email}</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  updateMutation.mutate()
                }}
              >
                <FloatingInput
                  id="edit_first_name"
                  label="Prenom"
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
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Telephone
                  </label>
                  <PhoneInputSenegal
                    id="edit_phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-border/50">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/20 text-white transition-all duration-300"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-border/50 text-foreground hover:bg-muted"
                    onClick={() => setEditingUser(null)}
                    disabled={updateMutation.isPending}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
