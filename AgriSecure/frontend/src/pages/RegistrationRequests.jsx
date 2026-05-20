import React, { useState } from "react"
import client from "../api/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  CheckCircle, XCircle, Clock, UserPlus, MapPin, Phone, Mail,
  Hash, Leaf, Filter, Search, Calendar, Users, Sparkles
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"

export default function RegistrationRequestsV3() {
  const [filter, setFilter] = useState("PENDING")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectModal, setShowRejectModal] = useState(false)

  const requestsQuery = useQuery({
    queryKey: ["registration-requests"],
    queryFn: async () => {
      const res = await client.get("/surveillance/registration-requests/")
      return Array.isArray(res.data) ? res.data : res.data?.results || []
    },
    refetchInterval: 10000,
  })

  const approveMutation = useMutation({
    mutationFn: async (requestId) => {
      const res = await client.post(`/surveillance/registration-requests/${requestId}/approve/`)
      return res.data
    },
    onSuccess: async () => {
      notify.success("Demande approuvée", "Le compte agent a été créé avec succès")
      setSelectedRequest(null)
      await requestsQuery.refetch()
    },
    onError: (err) => {
      const errorMsg = err?.response?.data?.error || "Impossible d'approuver la demande"
      notify.error("Erreur", errorMsg)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }) => {
      const res = await client.post(`/surveillance/registration-requests/${requestId}/reject/`, { reason })
      return res.data
    },
    onSuccess: async () => {
      notify.info("Demande rejetée", "La demande a été rejetée")
      setSelectedRequest(null)
      setRejectReason("")
      setShowRejectModal(false)
      await requestsQuery.refetch()
    },
    onError: (err) => {
      notify.error("Erreur", err?.response?.data?.error || "Impossible de rejeter la demande")
    },
  })

  const requests = requestsQuery.data || []

  const filteredRequests = requests
    .filter(r => r.status === filter)
    .filter(r => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return (
        r.first_name?.toLowerCase().includes(query) ||
        r.last_name?.toLowerCase().includes(query) ||
        r.email?.toLowerCase().includes(query) ||
        r.nin?.toLowerCase().includes(query) ||
        r.region?.toLowerCase().includes(query)
      )
    })

  const pendingCount = requests.filter(r => r.status === "PENDING").length
  const approvedCount = requests.filter(r => r.status === "APPROVED").length
  const rejectedCount = requests.filter(r => r.status === "REJECTED").length
  const totalCount = requests.length

  const handleApprove = (request) => {
    if (window.confirm(`Approuver la demande de ${request.first_name} ${request.last_name}?\n\nCela créera:\n• Compte agent avec email: ${request.email}\n• Mot de passe initial: ${request.nin}\n• Rendez-vous d'installation`)) {
      approveMutation.mutate(request.id)
    }
  }

  const handleReject = (request) => {
    setSelectedRequest(request)
    setShowRejectModal(true)
  }

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      notify.error("Erreur", "Veuillez indiquer une raison de rejet")
      return
    }
    rejectMutation.mutate({ requestId: selectedRequest.id, reason: rejectReason })
  }

  const getStatusBadge = (status) => {
    const configs = {
      PENDING: { icon: Clock, text: "En attente", className: "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0" },
      APPROVED: { icon: CheckCircle, text: "Approuvé", className: "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0" },
      REJECTED: { icon: XCircle, text: "Rejeté", className: "bg-gradient-to-r from-rose-500 to-red-600 text-white border-0" }
    }
    const config = configs[status]
    if (!config) return null
    const Icon = config.icon
    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const statsCards = [
    {
      label: "En attente",
      value: pendingCount,
      icon: Clock,
      gradient: "from-amber-500 to-orange-500",
      filterValue: "PENDING"
    },
    {
      label: "Approuvées",
      value: approvedCount,
      icon: CheckCircle,
      gradient: "from-amber-500 to-orange-600",
      filterValue: "APPROVED"
    },
    {
      label: "Rejetées",
      value: rejectedCount,
      icon: XCircle,
      gradient: "from-rose-500 to-red-600",
      filterValue: "REJECTED"
    },
    {
      label: "Total",
      value: totalCount,
      icon: Users,
      gradient: "from-sky-500 to-blue-600",
      filterValue: null
    }
  ]

  const filterTabs = [
    { key: "PENDING", label: "En attente", count: pendingCount, icon: Clock },
    { key: "APPROVED", label: "Approuvées", count: approvedCount, icon: CheckCircle },
    { key: "REJECTED", label: "Rejetées", count: rejectedCount, icon: XCircle },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.07] via-card to-card" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Demandes d'Inscription
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              Gérez les demandes avec élégance
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          const isActive = filter === stat.filterValue

          return (
            <div
              key={index}
              className={cn(
                "bg-card rounded-2xl border border-border/50 p-6 cursor-pointer transition-all hover:border-primary/20",
                isActive && "border-primary/40 ring-1 ring-primary/20"
              )}
              onClick={() => stat.filterValue && setFilter(stat.filterValue)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-medium">{stat.label}</p>
                  <p className="text-4xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg`}>
                  <Icon className="w-7 h-7" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter Tabs + Search */}
      <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {filterTabs.map((tab) => {
              const Icon = tab.icon
              const active = filter === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    active
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/20"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  <span className={cn(
                    "ml-1 text-xs px-1.5 py-0.5 rounded-md",
                    active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
          <Badge className="bg-primary/10 text-primary border border-primary/20">
            {filteredRequests.length} résultat(s)
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, NIN, région..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Request List */}
      <div className="space-y-4">
        {requestsQuery.isLoading ? (
          <div className="bg-card rounded-2xl border border-border/50 p-12 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 animate-ping opacity-20"></div>
              <Clock className="relative w-16 h-16 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground font-medium">Chargement des demandes...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 p-12 text-center">
            <UserPlus className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-xl font-bold text-foreground mb-2">Aucune demande</p>
            <p className="text-muted-foreground">
              {searchQuery ? "Aucun résultat pour votre recherche" : `Aucune demande ${filter.toLowerCase()}`}
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request.id} className="bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/20 transition-all">
              {/* Colored top bar by status */}
              <div className={cn(
                "h-1 bg-gradient-to-r",
                request.status === 'PENDING' && "from-amber-500 to-orange-500",
                request.status === 'APPROVED' && "from-amber-500 to-orange-600",
                request.status === 'REJECTED' && "from-rose-500 to-red-600"
              )} />

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Column 1: Personal info */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-1">
                          {request.first_name} {request.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(request.created_at)}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-sky-500/10">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <Hash className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">NIN</p>
                          <p className="font-mono font-bold text-foreground">{request.nin}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/10">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground font-medium">Email</p>
                          <p className="font-semibold truncate text-foreground">{request.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Téléphone</p>
                          <p className="font-semibold text-foreground">{request.phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Location */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-500" />
                      Localisation
                    </h4>

                    <div className="space-y-2">
                      <div className="p-4 rounded-xl bg-amber-500/10">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">Région</p>
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-sm px-3 py-1">
                          {request.region}
                        </Badge>
                      </div>

                      <div className="p-4 rounded-xl bg-sky-500/10">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">Localité</p>
                        <p className="font-semibold text-foreground">{request.locality}</p>
                      </div>

                      <div className="p-4 rounded-xl bg-violet-500/10">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">Adresse complète</p>
                        <p className="text-sm text-muted-foreground">{request.address}</p>
                      </div>

                      {request.farm_size && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10">
                          <Leaf className="w-5 h-5 text-amber-500" />
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Superficie</p>
                            <p className="text-sm font-bold text-foreground">{request.farm_size}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Actions */}
                  <div className="flex flex-col justify-between">
                    {request.status === "PENDING" ? (
                      <div className="space-y-3">
                        <Button
                          onClick={() => handleApprove(request)}
                          variant="gradient"
                          className="w-full"
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          {approveMutation.isPending ? "Approbation..." : "Approuver"}
                        </Button>

                        <Button
                          onClick={() => handleReject(request)}
                          variant="outline"
                          className="w-full border border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="w-5 h-5 mr-2" />
                          Rejeter
                        </Button>

                        <div className="pt-3 border-t border-border/50">
                          <p className="text-xs text-muted-foreground mb-3 font-semibold">Après approbation:</p>
                          <ul className="text-xs space-y-2">
                            <li className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10">
                              <CheckCircle className="w-4 h-4 text-amber-500" />
                              <span className="text-foreground font-medium">Compte agent créé</span>
                            </li>
                            <li className="flex items-center gap-2 p-2 rounded-lg bg-sky-500/10">
                              <CheckCircle className="w-4 h-4 text-sky-500" />
                              <span className="text-foreground font-medium">Rendez-vous planifié</span>
                            </li>
                            <li className="flex items-center gap-2 p-2 rounded-lg bg-violet-500/10">
                              <CheckCircle className="w-4 h-4 text-violet-500" />
                              <span className="text-foreground font-medium">Login: email + NIN</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-muted rounded-xl p-6 border border-border/50">
                          <p className="text-base font-bold text-foreground mb-2">
                            {request.status === 'APPROVED' ? '✅ Demande approuvée' : '❌ Demande rejetée'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.processed_at && `Le ${formatDate(request.processed_at)}`}
                          </p>
                        </div>

                        {request.status === 'REJECTED' && request.rejection_reason && (
                          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                            <p className="text-xs font-bold text-destructive mb-2">Raison du rejet:</p>
                            <p className="text-sm text-muted-foreground">{request.rejection_reason}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-border/50 bg-destructive/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Rejeter la Demande</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.first_name} {selectedRequest.last_name} - {selectedRequest.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold mb-3 block text-foreground">
                  Raison du rejet <span className="text-destructive">*</span>
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-muted border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all"
                  rows={4}
                  placeholder="Expliquez pourquoi cette demande est rejetée..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/50">
                <Button
                  onClick={confirmReject}
                  variant="gradient-destructive"
                  className="flex-1"
                  disabled={rejectMutation.isPending || !rejectReason.trim()}
                >
                  {rejectMutation.isPending ? "Rejet..." : "Confirmer le Rejet"}
                </Button>
                <Button
                  onClick={() => {
                    setShowRejectModal(false)
                    setSelectedRequest(null)
                    setRejectReason("")
                  }}
                  variant="outline"
                  className="flex-1 border border-border/50 text-muted-foreground hover:text-foreground"
                  disabled={rejectMutation.isPending}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
