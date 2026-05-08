import React, { useState } from "react"
import client from "../api/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  CheckCircle, XCircle, Clock, UserPlus, MapPin, Phone, Mail,
  Hash, Leaf, Filter, Search, Calendar, TrendingUp, Users
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FloatingInput } from "@/components/ui/floating-input"
import { notify } from "@/lib/notify"

export default function RegistrationRequestsV2() {
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
    refetchInterval: 10000, // Refresh toutes les 10s
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

  // Filtrage et recherche
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
      PENDING: { icon: Clock, text: "En attente", className: "bg-yellow-100 text-yellow-700 border-yellow-300" },
      APPROVED: { icon: CheckCircle, text: "Approuvé", className: "bg-green-100 text-green-700 border-green-300" },
      REJECTED: { icon: XCircle, text: "Rejeté", className: "bg-red-100 text-red-700 border-red-300" }
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
      gradient: "from-yellow-500 to-yellow-600",
      bg: "bg-yellow-50",
      onClick: () => setFilter("PENDING")
    },
    {
      label: "Approuvées",
      value: approvedCount,
      icon: CheckCircle,
      gradient: "from-green-500 to-green-600",
      bg: "bg-green-50",
      onClick: () => setFilter("APPROVED")
    },
    {
      label: "Rejetées",
      value: rejectedCount,
      icon: XCircle,
      gradient: "from-red-500 to-red-600",
      bg: "bg-red-50",
      onClick: () => setFilter("REJECTED")
    },
    {
      label: "Total",
      value: totalCount,
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      bg: "bg-blue-50",
      onClick: () => {}
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Demandes d'Inscription
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez les demandes d'inscription des agents agricoles
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          const isActive = filter === ["PENDING", "APPROVED", "REJECTED"][index]

          return (
            <Card
              key={index}
              className={`cursor-pointer hover:shadow-xl transition-all duration-300 border-0 ${stat.bg} ${isActive ? 'ring-2 ring-offset-2 ring-gray-900' : ''}`}
              onClick={stat.onClick}
            >
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

      {/* Filtres et Recherche */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                Filtres
              </CardTitle>
              <CardDescription>Rechercher et filtrer les demandes</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(filter)}
              <Badge variant="secondary">{filteredRequests.length} résultat(s)</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, NIN, région..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des demandes */}
      <div className="space-y-4">
        {requestsQuery.isLoading ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 animate-pulse text-blue-600" />
              <p className="text-muted-foreground">Chargement des demandes...</p>
            </CardContent>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <UserPlus className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900 mb-2">Aucune demande</p>
              <p className="text-muted-foreground">
                {searchQuery ? "Aucun résultat pour votre recherche" : `Aucune demande ${filter.toLowerCase()}`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              {/* Barre de couleur en haut */}
              <div className={`h-2 ${
                request.status === 'PENDING' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                request.status === 'APPROVED' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                'bg-gradient-to-r from-red-500 to-red-600'
              }`} />

              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Colonne 1: Informations personnelles */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
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
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Hash className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">NIN</p>
                          <p className="font-mono font-medium">{request.nin}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="font-medium truncate">{request.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Téléphone</p>
                          <p className="font-medium">{request.phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Colonne 2: Localisation */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-600" />
                      Localisation
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Région</p>
                        <Badge variant="secondary" className="font-medium">
                          {request.region}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Localité</p>
                        <p className="font-medium">{request.locality}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Adresse complète</p>
                        <p className="text-sm">{request.address}</p>
                      </div>

                      {request.farm_size && (
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Leaf className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Superficie</p>
                            <p className="text-sm font-medium">{request.farm_size}</p>
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
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all"
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {approveMutation.isPending ? "Approbation..." : "Approuver"}
                        </Button>

                        <Button
                          onClick={() => handleReject(request)}
                          variant="outline"
                          className="w-full border-red-300 text-red-600 hover:bg-red-50"
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Rejeter
                        </Button>

                        <div className="pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Après approbation:</p>
                          <ul className="text-xs space-y-1 text-muted-foreground">
                            <li className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              Compte agent créé
                            </li>
                            <li className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              Rendez-vous planifié
                            </li>
                            <li className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              Login: email + NIN
                            </li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-secondary/50 rounded-lg p-4">
                          <p className="text-sm font-medium mb-2">
                            {request.status === 'APPROVED' ? '✅ Demande approuvée' : '❌ Demande rejetée'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {request.processed_at && `Le ${formatDate(request.processed_at)}`}
                          </p>
                        </div>

                        {request.status === 'REJECTED' && request.rejection_reason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-xs font-medium text-red-900 mb-1">Raison du rejet:</p>
                            <p className="text-sm text-red-800">{request.rejection_reason}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Rejet */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="max-w-md w-full border-0 shadow-2xl">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" />
                Rejeter la Demande
              </CardTitle>
              <CardDescription>
                {selectedRequest.first_name} {selectedRequest.last_name} - {selectedRequest.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Raison du rejet <span className="text-red-600">*</span>
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Expliquez pourquoi cette demande est rejetée..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={confirmReject}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
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
                  className="flex-1"
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
