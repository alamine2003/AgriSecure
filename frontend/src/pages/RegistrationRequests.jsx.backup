import React, { useState } from "react"
import client from "../api/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  CheckCircle, XCircle, Clock, UserPlus, MapPin, Phone, Mail,
  Hash, Leaf, Filter, Search, Calendar, Users, Sparkles
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { notify } from "@/lib/notify"

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
      PENDING: { icon: Clock, text: "En attente", className: "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white border-0" },
      APPROVED: { icon: CheckCircle, text: "Approuvé", className: "bg-gradient-to-r from-green-400 to-green-500 text-white border-0" },
      REJECTED: { icon: XCircle, text: "Rejeté", className: "bg-gradient-to-r from-red-400 to-red-500 text-white border-0" }
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
      gradient: "from-yellow-400 via-yellow-500 to-orange-500",
      onClick: () => setFilter("PENDING")
    },
    {
      label: "Approuvées",
      value: approvedCount,
      icon: CheckCircle,
      gradient: "from-green-400 via-green-500 to-emerald-500",
      onClick: () => setFilter("APPROVED")
    },
    {
      label: "Rejetées",
      value: rejectedCount,
      icon: XCircle,
      gradient: "from-red-400 via-red-500 to-rose-500",
      onClick: () => setFilter("REJECTED")
    },
    {
      label: "Total",
      value: totalCount,
      icon: Users,
      gradient: "from-blue-400 via-blue-500 to-indigo-500",
      onClick: () => {}
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6 space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-lg opacity-50"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-blue-900 bg-clip-text text-transparent">
              Demandes d'Inscription
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Gérez les demandes avec élégance
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          const isActive = filter === ["PENDING", "APPROVED", "REJECTED"][index]

          return (
            <div
              key={index}
              className="group relative cursor-pointer"
              onClick={stat.onClick}
            >
              {/* Glow effect */}
              <div className={`absolute -inset-1 bg-gradient-to-r ${stat.gradient} rounded-3xl opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500`}></div>

              <Card className={`relative bg-white/80 backdrop-blur-xl border-2 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${
                isActive ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-white/20'
              }`}>
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

      {/* Filtres et Recherche */}
      <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                Recherche & Filtres
              </CardTitle>
              <CardDescription>Explorez les demandes intelligemment</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(filter)}
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                {filteredRequests.length} résultat(s)
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, NIN, région..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/50 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des demandes */}
      <div className="space-y-4">
        {requestsQuery.isLoading ? (
          <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-ping opacity-20"></div>
                <Clock className="relative w-16 h-16 text-blue-600 animate-pulse" />
              </div>
              <p className="text-muted-foreground font-medium">Chargement des demandes...</p>
            </CardContent>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl">
            <CardContent className="p-12 text-center">
              <UserPlus className="w-20 h-20 mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-bold text-gray-900 mb-2">Aucune demande</p>
              <p className="text-muted-foreground">
                {searchQuery ? "Aucun résultat pour votre recherche" : `Aucune demande ${filter.toLowerCase()}`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <div key={request.id} className="group relative">
              {/* Hover glow */}
              <div className={`absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 ${
                request.status === 'PENDING' ? 'bg-yellow-500' :
                request.status === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'
              }`} />

              <Card className="relative bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                {/* Barre de couleur gradient */}
                <div className={`h-2 bg-gradient-to-r ${
                  request.status === 'PENDING' ? 'from-yellow-400 via-yellow-500 to-orange-500' :
                  request.status === 'APPROVED' ? 'from-green-400 via-green-500 to-emerald-500' :
                  'from-red-400 via-red-500 to-rose-500'
                }`} />

                <CardContent className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Colonne 1: Informations personnelles */}
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-1">
                            {request.first_name} {request.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(request.created_at)}
                          </p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 group-hover:scale-105 transition-transform">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Hash className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">NIN</p>
                            <p className="font-mono font-bold text-gray-900">{request.nin}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 group-hover:scale-105 transition-transform">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Mail className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground font-medium">Email</p>
                            <p className="font-semibold truncate text-gray-900">{request.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 group-hover:scale-105 transition-transform">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Phone className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Téléphone</p>
                            <p className="font-semibold text-gray-900">{request.phone}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Colonne 2: Localisation */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-orange-600" />
                        Localisation
                      </h4>

                      <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-red-50">
                          <p className="text-xs text-muted-foreground mb-2 font-medium">Région</p>
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-sm px-3 py-1">
                            {request.region}
                          </Badge>
                        </div>

                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
                          <p className="text-xs text-muted-foreground mb-2 font-medium">Localité</p>
                          <p className="font-semibold text-gray-900">{request.locality}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50">
                          <p className="text-xs text-muted-foreground mb-2 font-medium">Adresse complète</p>
                          <p className="text-sm text-gray-700">{request.address}</p>
                        </div>

                        {request.farm_size && (
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-50 to-lime-50">
                            <Leaf className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">Superficie</p>
                              <p className="text-sm font-bold text-gray-900">{request.farm_size}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Colonne 3: Actions */}
                    <div className="flex flex-col justify-between">
                      {request.status === "PENDING" ? (
                        <div className="space-y-3">
                          <Button
                            onClick={() => handleApprove(request)}
                            className="w-full bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            {approveMutation.isPending ? "Approbation..." : "Approuver"}
                          </Button>

                          <Button
                            onClick={() => handleReject(request)}
                            variant="outline"
                            className="w-full border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="w-5 h-5 mr-2" />
                            Rejeter
                          </Button>

                          <div className="pt-3 border-t-2 border-dashed border-gray-200">
                            <p className="text-xs text-muted-foreground mb-3 font-semibold">Après approbation:</p>
                            <ul className="text-xs space-y-2">
                              <li className="flex items-center gap-2 p-2 rounded-lg bg-green-50">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-green-900 font-medium">Compte agent créé</span>
                              </li>
                              <li className="flex items-center gap-2 p-2 rounded-lg bg-blue-50">
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                                <span className="text-blue-900 font-medium">Rendez-vous planifié</span>
                              </li>
                              <li className="flex items-center gap-2 p-2 rounded-lg bg-purple-50">
                                <CheckCircle className="w-4 h-4 text-purple-600" />
                                <span className="text-purple-900 font-medium">Login: email + NIN</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
                            <p className="text-base font-bold mb-2">
                              {request.status === 'APPROVED' ? '✅ Demande approuvée' : '❌ Demande rejetée'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.processed_at && `Le ${formatDate(request.processed_at)}`}
                            </p>
                          </div>

                          {request.status === 'REJECTED' && request.rejection_reason && (
                            <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-xl p-4">
                              <p className="text-xs font-bold text-red-900 mb-2">Raison du rejet:</p>
                              <p className="text-sm text-red-800">{request.rejection_reason}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>

      {/* Modal Rejet */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-lg animate-in fade-in duration-300">
          <Card className="max-w-md w-full bg-white/95 backdrop-blur-xl border-2 border-white/20 shadow-2xl animate-in zoom-in-95 duration-300">
            <CardHeader className="border-b-2 border-gray-100 bg-gradient-to-r from-red-50 to-rose-50">
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="w-6 h-6" />
                Rejeter la Demande
              </CardTitle>
              <CardDescription className="font-medium">
                {selectedRequest.first_name} {selectedRequest.last_name} - {selectedRequest.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-bold mb-3 block text-gray-900">
                  Raison du rejet <span className="text-red-600">*</span>
                </label>
                <textarea
                  className="w-full px-4 py-4 bg-white/50 backdrop-blur-sm border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none transition-all"
                  rows={4}
                  placeholder="Expliquez pourquoi cette demande est rejetée..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
                <Button
                  onClick={confirmReject}
                  className="flex-1 bg-gradient-to-r from-red-500 via-red-600 to-rose-600 hover:from-red-600 hover:via-red-700 hover:to-rose-700 shadow-lg"
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
                  className="flex-1 border-2"
                  disabled={rejectMutation.isPending}
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
