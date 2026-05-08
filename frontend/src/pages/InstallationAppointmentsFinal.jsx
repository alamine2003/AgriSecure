import React, { useState } from "react"
import client from "../api/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  Calendar, MapPin, User, CheckCircle, XCircle, Clock,
  Camera, Navigation, Package, Sparkles, AlertTriangle, Mail
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FloatingInput } from "@/components/ui/floating-input"
import { LocationSelector } from "@/components/ui/location-selector"
import { notify } from "@/lib/notify"

const STATUS_CONFIG = {
  PENDING: { label: "En attente", icon: Clock, gradient: "from-yellow-400 via-yellow-500 to-orange-500" },
  SCHEDULED: { label: "Planifié", icon: Calendar, gradient: "from-blue-400 via-blue-500 to-indigo-500" },
  DONE: { label: "Terminé", icon: CheckCircle, gradient: "from-green-400 via-green-500 to-emerald-500" },
  CANCELLED: { label: "Annulé", icon: XCircle, gradient: "from-red-400 via-red-500 to-rose-500" },
}

export default function InstallationAppointmentsFinal() {
  const [filterStatus, setFilterStatus] = useState("PENDING")
  const [search, setSearch] = useState("")
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [locationData, setLocationData] = useState(null)
  const [completionData, setCompletionData] = useState({
    latitude: "",
    longitude: "",
    installation_notes: "",
    equipment_installed: [
      { name: "Caméra 1", index: 0, latitude: "", longitude: "" }
    ]
  })

  const appointmentsQuery = useQuery({
    queryKey: ["installation-appointments", filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filterStatus) params.set("status", filterStatus)
      params.set("ordering", "status,-created_at")
      const res = await client.get(`/surveillance/installation-appointments/?${params.toString()}`)
      return Array.isArray(res.data) ? res.data : res.data?.results || []
    },
    refetchInterval: 15000,
  })

  const completeInstallationMutation = useMutation({
    mutationFn: async ({ appointmentId, data }) => {
      // Convertir en nombres
      const payload = {
        ...data,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        equipment_installed: data.equipment_installed.map(eq => ({
          ...eq,
          latitude: eq.latitude ? parseFloat(eq.latitude) : parseFloat(data.latitude),
          longitude: eq.longitude ? parseFloat(eq.longitude) : parseFloat(data.longitude)
        }))
      }

      const res = await client.post(
        `/surveillance/installation-appointments/${appointmentId}/complete_installation/`,
        payload
      )
      return res.data
    },
    onSuccess: async () => {
      notify.success("Installation terminée", "L'agent peut maintenant se connecter et accéder à son dashboard")
      setShowCompleteModal(false)
      setSelectedAppointment(null)
      setLocationData(null)
      setCompletionData({
        latitude: "",
        longitude: "",
        installation_notes: "",
        equipment_installed: [{ name: "Caméra 1", index: 0, latitude: "", longitude: "" }]
      })
      await appointmentsQuery.refetch()
    },
    onError: (err) => {
      console.error("Erreur installation:", err.response?.data)
      notify.error("Erreur", err?.response?.data?.detail || err?.response?.data?.error || "Impossible de terminer l'installation")
    },
  })

  const appointments = appointmentsQuery.data || []
  const filteredAppointments = appointments.filter(a => {
    if (!search.trim()) return true
    const query = search.toLowerCase()
    return (
      a.agent_first_name?.toLowerCase().includes(query) ||
      a.agent_last_name?.toLowerCase().includes(query) ||
      a.agent_email?.toLowerCase().includes(query) ||
      a.region?.toLowerCase().includes(query) ||
      a.locality?.toLowerCase().includes(query)
    )
  })

  const statsCount = {
    pending: appointments.filter(a => a.status === "PENDING").length,
    scheduled: appointments.filter(a => a.status === "SCHEDULED").length,
    done: appointments.filter(a => a.status === "DONE").length,
    cancelled: appointments.filter(a => a.status === "CANCELLED").length,
  }

  const handleCompleteInstallation = (appointment) => {
    setSelectedAppointment(appointment)
    setCompletionData({
      latitude: appointment.latitude || "",
      longitude: appointment.longitude || "",
      installation_notes: "",
      equipment_installed: [
        { name: "Caméra 1", index: 0, latitude: "", longitude: "" }
      ]
    })
    setShowCompleteModal(true)
  }

  const handleLocationSelect = (location) => {
    setLocationData(location)
    if (location.gps) {
      setCompletionData(prev => ({
        ...prev,
        latitude: location.gps.lat.toString(),
        longitude: location.gps.lng.toString(),
        equipment_installed: prev.equipment_installed.map(eq => ({
          ...eq,
          latitude: location.gps.lat.toString(),
          longitude: location.gps.lng.toString()
        }))
      }))
    }
  }

  const addCamera = () => {
    setCompletionData(prev => ({
      ...prev,
      equipment_installed: [
        ...prev.equipment_installed,
        {
          name: `Caméra ${prev.equipment_installed.length + 1}`,
          index: prev.equipment_installed.length,
          latitude: prev.latitude,
          longitude: prev.longitude
        }
      ]
    }))
  }

  const removeCamera = (index) => {
    setCompletionData(prev => ({
      ...prev,
      equipment_installed: prev.equipment_installed.filter((_, i) => i !== index)
    }))
  }

  const updateCamera = (index, field, value) => {
    setCompletionData(prev => ({
      ...prev,
      equipment_installed: prev.equipment_installed.map((cam, i) =>
        i === index ? { ...cam, [field]: value } : cam
      )
    }))
  }

  const submitCompletion = () => {
    if (!completionData.latitude || !completionData.longitude) {
      notify.error("Erreur", "Veuillez fournir les coordonnées GPS du lieu d'installation")
      return
    }

    if (completionData.equipment_installed.length === 0) {
      notify.error("Erreur", "Veuillez ajouter au moins une caméra")
      return
    }

    completeInstallationMutation.mutate({
      appointmentId: selectedAppointment.id,
      data: completionData
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Non défini"
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statsCards = [
    { label: "En attente", value: statsCount.pending, status: "PENDING" },
    { label: "Planifiés", value: statsCount.scheduled, status: "SCHEDULED" },
    { label: "Terminés", value: statsCount.done, status: "DONE" },
    { label: "Annulés", value: statsCount.cancelled, status: "CANCELLED" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 p-6 space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl p-8">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl blur-lg opacity-50"></div>
            <div className="relative bg-gradient-to-br from-green-500 to-teal-600 p-3 rounded-2xl">
              <MapPin className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-green-900 bg-clip-text text-transparent">
              Rendez-vous d'Installation
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-500" />
              Gestion des installations d'équipement de surveillance
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const config = STATUS_CONFIG[stat.status]
          const Icon = config.icon
          const isActive = filterStatus === stat.status

          return (
            <div
              key={index}
              className="group relative cursor-pointer"
              onClick={() => setFilterStatus(stat.status)}
            >
              <div className={`absolute -inset-1 bg-gradient-to-r ${config.gradient} rounded-3xl opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500`}></div>

              <Card className={`relative bg-white/80 backdrop-blur-xl border-2 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${
                isActive ? 'border-green-500 shadow-lg shadow-green-500/20' : 'border-white/20'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2 font-medium">{stat.label}</p>
                      <p className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                      <Icon className="w-8 h-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Search */}
      <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl">
        <CardContent className="pt-6">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par agent, région, localité..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/50 backdrop-blur-sm border-2 border-gray-200 rounded-2xl
                       focus:ring-2 focus:ring-green-500 focus:border-green-500
                       hover:border-gray-300 hover:shadow-md
                       transition-all duration-300 outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Appointments List - Simplified for space */}
      <div className="space-y-4">
        {appointmentsQuery.isLoading ? (
          <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl">
            <CardContent className="p-12 text-center">
              <Clock className="w-16 h-16 mx-auto mb-4 animate-pulse text-green-600" />
              <p className="text-muted-foreground font-medium">Chargement...</p>
            </CardContent>
          </Card>
        ) : filteredAppointments.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl">
            <CardContent className="p-12 text-center">
              <Calendar className="w-20 h-20 mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-bold text-gray-900 mb-2">Aucun rendez-vous</p>
            </CardContent>
          </Card>
        ) : (
          filteredAppointments.map((appointment) => {
            const config = STATUS_CONFIG[appointment.status]
            const Icon = config.icon

            return (
              <Card key={appointment.id} className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {appointment.agent_first_name} {appointment.agent_last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4" />
                        {appointment.agent_email}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {appointment.region}, {appointment.locality}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`bg-gradient-to-r ${config.gradient} text-white border-0`}>
                        <Icon className="w-4 h-4 mr-1" />
                        {config.label}
                      </Badge>
                      {(appointment.status === "PENDING" || appointment.status === "SCHEDULED") && (
                        <Button
                          onClick={() => handleCompleteInstallation(appointment)}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Terminer Installation
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Modal Completion */}
      {showCompleteModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-lg overflow-y-auto">
          <Card className="max-w-4xl w-full bg-white/95 backdrop-blur-xl border-2 border-white/20 shadow-2xl my-8">
            <CardHeader className="border-b-2 border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-6 h-6" />
                Compléter l'Installation
              </CardTitle>
              <CardDescription className="font-medium">
                {selectedAppointment.agent_first_name} {selectedAppointment.agent_last_name} -
                {selectedAppointment.region}, {selectedAppointment.locality}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Sélecteur de localisation */}
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-green-600" />
                  Localisation Précise
                </h3>
                <LocationSelector
                  onLocationSelect={handleLocationSelect}
                  initialRegion={selectedAppointment.region}
                  initialCommune={selectedAppointment.locality}
                  showGPS={true}
                />
              </div>

              {/* GPS Manuel (si nécessaire) */}
              {!locationData && (
                <div className="p-4 rounded-xl bg-yellow-50 border-2 border-yellow-200">
                  <p className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    GPS Manuel
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <FloatingInput
                      id="manual_lat"
                      label="Latitude"
                      type="number"
                      step="0.000001"
                      value={completionData.latitude}
                      onChange={(e) => setCompletionData(prev => ({ ...prev, latitude: e.target.value }))}
                    />
                    <FloatingInput
                      id="manual_lng"
                      label="Longitude"
                      type="number"
                      step="0.000001"
                      value={completionData.longitude}
                      onChange={(e) => setCompletionData(prev => ({ ...prev, longitude: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Caméras */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Camera className="w-5 h-5 text-blue-600" />
                    Caméras ({completionData.equipment_installed.length})
                  </h3>
                  <Button onClick={addCamera} variant="outline" size="sm" className="border-2 hover:scale-105 transition-transform">
                    <Package className="w-4 h-4 mr-2" />
                    Ajouter Caméra
                  </Button>
                </div>

                <div className="space-y-3">
                  {completionData.equipment_installed.map((camera, index) => (
                    <div key={index} className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-blue-900">Caméra #{index + 1}</h4>
                        {completionData.equipment_installed.length > 1 && (
                          <Button onClick={() => removeCamera(index)} variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <FloatingInput
                        id={`camera_name_${index}`}
                        label="Nom de la caméra"
                        value={camera.name}
                        onChange={(e) => updateCamera(index, 'name', e.target.value)}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes Techniques d'Installation
                </label>
                <textarea
                  className="w-full px-4 py-4 bg-white/50 backdrop-blur-sm border-2 border-gray-300 rounded-xl
                           focus:ring-2 focus:ring-green-500 focus:border-green-500
                           hover:border-gray-400 hover:shadow-md
                           resize-none transition-all duration-300 outline-none"
                  rows={4}
                  placeholder="Détails techniques, configurations, observations..."
                  value={completionData.installation_notes}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, installation_notes: e.target.value }))}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t-2">
                <Button
                  onClick={submitCompletion}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
                  disabled={completeInstallationMutation.isPending}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {completeInstallationMutation.isPending ? "Enregistrement..." : "Valider Installation"}
                </Button>
                <Button
                  onClick={() => {
                    setShowCompleteModal(false)
                    setSelectedAppointment(null)
                    setLocationData(null)
                  }}
                  variant="outline"
                  className="flex-1 border-2"
                  disabled={completeInstallationMutation.isPending}
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
