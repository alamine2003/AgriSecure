import React, { useState } from "react"
import client from "../api/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  Calendar, MapPin, User, CheckCircle, XCircle, Clock,
  Settings, Navigation, Camera, Zap, Package, Sparkles,
  AlertTriangle, Phone, Mail, MapPinned, Users, TrendingUp
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FloatingInput } from "@/components/ui/floating-input"
import { notify } from "@/lib/notify"

const SENEGAL_REGIONS = [
  "Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack", "Kedougou",
  "Kolda", "Louga", "Matam", "Saint-Louis", "Sedhiou", "Tambacounda",
  "Thies", "Ziguinchor"
]

const STATUS_CONFIG = {
  PENDING: { label: "En attente", icon: Clock, gradient: "from-yellow-400 via-yellow-500 to-orange-500", bg: "bg-yellow-50" },
  SCHEDULED: { label: "Planifié", icon: Calendar, gradient: "from-blue-400 via-blue-500 to-indigo-500", bg: "bg-blue-50" },
  DONE: { label: "Terminé", icon: CheckCircle, gradient: "from-green-400 via-green-500 to-emerald-500", bg: "bg-green-50" },
  CANCELLED: { label: "Annulé", icon: XCircle, gradient: "from-red-400 via-red-500 to-rose-500", bg: "bg-red-50" },
}

export default function InstallationAppointmentsV3() {
  const [filterStatus, setFilterStatus] = useState("PENDING")
  const [search, setSearch] = useState("")
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
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
      const res = await client.post(`/surveillance/installation-appointments/${appointmentId}/complete_installation/`, data)
      return res.data
    },
    onSuccess: async () => {
      notify.success("Installation terminée", "L'agent peut maintenant se connecter et accéder à son dashboard")
      setShowCompleteModal(false)
      setSelectedAppointment(null)
      setCompletionData({
        latitude: "",
        longitude: "",
        installation_notes: "",
        equipment_installed: [{ name: "Caméra 1", index: 0, latitude: "", longitude: "" }]
      })
      await appointmentsQuery.refetch()
    },
    onError: (err) => {
      notify.error("Erreur", err?.response?.data?.error || "Impossible de terminer l'installation")
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

  const pendingCount = appointments.filter(a => a.status === "PENDING").length
  const scheduledCount = appointments.filter(a => a.status === "SCHEDULED").length
  const doneCount = appointments.filter(a => a.status === "DONE").length
  const cancelledCount = appointments.filter(a => a.status === "CANCELLED").length

  const statsCards = [
    { label: "En attente", value: pendingCount, status: "PENDING" },
    { label: "Planifiés", value: scheduledCount, status: "SCHEDULED" },
    { label: "Terminés", value: doneCount, status: "DONE" },
    { label: "Annulés", value: cancelledCount, status: "CANCELLED" },
  ]

  const handleCompleteInstallation = (appointment) => {
    setSelectedAppointment(appointment)
    setCompletionData({
      latitude: appointment.latitude || "",
      longitude: appointment.longitude || "",
      installation_notes: "",
      equipment_installed: [
        { name: "Caméra 1", index: 0, latitude: appointment.latitude || "", longitude: appointment.longitude || "" }
      ]
    })
    setShowCompleteModal(true)
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
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 p-6 space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl blur-lg opacity-50"></div>
            <div className="relative bg-gradient-to-br from-green-500 to-teal-600 p-3 rounded-2xl">
              <MapPinned className="w-8 h-8 text-white" />
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
              className="w-full pl-12 pr-4 py-4 bg-white/50 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <div className="space-y-4">
        {appointmentsQuery.isLoading ? (
          <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-teal-500 animate-ping opacity-20"></div>
                <Clock className="relative w-16 h-16 text-green-600 animate-pulse" />
              </div>
              <p className="text-muted-foreground font-medium">Chargement des rendez-vous...</p>
            </CardContent>
          </Card>
        ) : filteredAppointments.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl">
            <CardContent className="p-12 text-center">
              <Calendar className="w-20 h-20 mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-bold text-gray-900 mb-2">Aucun rendez-vous</p>
              <p className="text-muted-foreground">
                {search ? "Aucun résultat pour votre recherche" : `Aucun rendez-vous ${STATUS_CONFIG[filterStatus].label.toLowerCase()}`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAppointments.map((appointment) => {
            const config = STATUS_CONFIG[appointment.status]
            const Icon = config.icon

            return (
              <div key={appointment.id} className="group relative">
                <div className={`absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 bg-gradient-to-r ${config.gradient}`} />

                <Card className="relative bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                  <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />

                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Colonne 1: Info Agent */}
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-1">
                              {appointment.agent_first_name} {appointment.agent_last_name}
                            </h3>
                            <Badge className={`bg-gradient-to-r ${config.gradient} text-white border-0`}>
                              <Icon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                              <Mail className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-muted-foreground font-medium">Email</p>
                              <p className="font-semibold truncate text-gray-900">{appointment.agent_email}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Colonne 2: Localisation */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                          <Navigation className="w-5 h-5 text-green-600" />
                          Localisation
                        </h4>

                        <div className="space-y-3">
                          <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
                            <p className="text-xs text-muted-foreground mb-2 font-medium">Région</p>
                            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-sm px-3 py-1">
                              {appointment.region}
                            </Badge>
                          </div>

                          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
                            <p className="text-xs text-muted-foreground mb-2 font-medium">Localité</p>
                            <p className="font-semibold text-gray-900">{appointment.locality}</p>
                          </div>

                          {appointment.address && (
                            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50">
                              <p className="text-xs text-muted-foreground mb-2 font-medium">Adresse</p>
                              <p className="text-sm text-gray-700">{appointment.address}</p>
                            </div>
                          )}

                          {appointment.latitude && appointment.longitude && (
                            <div className="p-3 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200">
                              <p className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1">
                                <MapPinned className="w-3 h-3" />
                                Coordonnées GPS
                              </p>
                              <p className="text-xs font-mono font-bold text-gray-900">
                                {appointment.latitude}, {appointment.longitude}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Colonne 3: Dates */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          Planning
                        </h4>

                        <div className="space-y-3">
                          <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50">
                            <p className="text-xs text-muted-foreground mb-1 font-medium">Créé le</p>
                            <p className="text-sm font-semibold text-gray-900">{formatDate(appointment.created_at)}</p>
                          </div>

                          {appointment.scheduled_at && (
                            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                              <p className="text-xs text-muted-foreground mb-1 font-medium">Planifié pour</p>
                              <p className="text-sm font-semibold text-gray-900">{formatDate(appointment.scheduled_at)}</p>
                            </div>
                          )}

                          {appointment.completed_at && (
                            <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
                              <p className="text-xs text-muted-foreground mb-1 font-medium">Terminé le</p>
                              <p className="text-sm font-semibold text-gray-900">{formatDate(appointment.completed_at)}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Colonne 4: Actions */}
                      <div className="flex flex-col justify-between space-y-3">
                        {appointment.status === "PENDING" || appointment.status === "SCHEDULED" ? (
                          <>
                            <Button
                              onClick={() => handleCompleteInstallation(appointment)}
                              className="w-full bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                              <CheckCircle className="w-5 h-5 mr-2" />
                              Terminer Installation
                            </Button>

                            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                              <p className="text-xs font-bold text-blue-900 mb-2 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Action requise
                              </p>
                              <p className="text-xs text-blue-800">
                                Cliquez pour enregistrer l'équipement installé et activer l'agent
                              </p>
                            </div>
                          </>
                        ) : appointment.status === "DONE" ? (
                          <div className="space-y-3">
                            <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
                              <p className="text-center font-bold text-green-900">Installation Terminée</p>
                              <p className="text-xs text-center text-green-700 mt-2">Agent activé et opérationnel</p>
                            </div>

                            {appointment.equipment_installed && appointment.equipment_installed.length > 0 && (
                              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                                <p className="text-xs font-bold text-purple-900 mb-3 flex items-center gap-1">
                                  <Camera className="w-4 h-4" />
                                  Équipement installé
                                </p>
                                <ul className="space-y-1">
                                  {appointment.equipment_installed.map((eq, idx) => (
                                    <li key={idx} className="text-xs text-purple-800 flex items-center gap-1">
                                      <Zap className="w-3 h-3" />
                                      {eq.name}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : null}

                        {appointment.notes && (
                          <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200">
                            <p className="text-xs font-medium text-gray-500 mb-2">Notes:</p>
                            <p className="text-xs text-gray-700">{appointment.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })
        )}
      </div>

      {/* Modal Completion Installation */}
      {showCompleteModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-lg animate-in fade-in duration-300 overflow-y-auto">
          <Card className="max-w-4xl w-full bg-white/95 backdrop-blur-xl border-2 border-white/20 shadow-2xl animate-in zoom-in-95 duration-300 my-8">
            <CardHeader className="border-b-2 border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-6 h-6" />
                Compléter l'Installation
              </CardTitle>
              <CardDescription className="font-medium">
                {selectedAppointment.agent_first_name} {selectedAppointment.agent_last_name} - {selectedAppointment.region}, {selectedAppointment.locality}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* GPS Lieu Installation */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-green-600" />
                  Coordonnées GPS du Lieu
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FloatingInput
                    id="latitude"
                    label="Latitude"
                    type="number"
                    step="0.0000001"
                    value={completionData.latitude}
                    onChange={(e) => setCompletionData(prev => ({ ...prev, latitude: e.target.value }))}
                    required
                    icon={<MapPin className="w-4 h-4" />}
                  />
                  <FloatingInput
                    id="longitude"
                    label="Longitude"
                    type="number"
                    step="0.0000001"
                    value={completionData.longitude}
                    onChange={(e) => setCompletionData(prev => ({ ...prev, longitude: e.target.value }))}
                    required
                    icon={<MapPin className="w-4 h-4" />}
                  />
                </div>
              </div>

              {/* Équipement Installé */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Camera className="w-5 h-5 text-blue-600" />
                    Caméras Installées ({completionData.equipment_installed.length})
                  </h3>
                  <Button
                    onClick={addCamera}
                    variant="outline"
                    size="sm"
                    className="border-2 hover:scale-105 transition-transform"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Ajouter Caméra
                  </Button>
                </div>

                <div className="space-y-4">
                  {completionData.equipment_installed.map((camera, index) => (
                    <div key={index} className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-blue-900">Caméra #{index + 1}</h4>
                        {completionData.equipment_installed.length > 1 && (
                          <Button
                            onClick={() => removeCamera(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
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

                      <div className="grid grid-cols-2 gap-3">
                        <FloatingInput
                          id={`camera_lat_${index}`}
                          label="Latitude GPS"
                          type="number"
                          step="0.0000001"
                          value={camera.latitude}
                          onChange={(e) => updateCamera(index, 'latitude', e.target.value)}
                          placeholder={completionData.latitude}
                        />
                        <FloatingInput
                          id={`camera_lng_${index}`}
                          label="Longitude GPS"
                          type="number"
                          step="0.0000001"
                          value={camera.longitude}
                          onChange={(e) => updateCamera(index, 'longitude', e.target.value)}
                          placeholder={completionData.longitude}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes Installation */}
              <div className="space-y-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  Notes Techniques
                </h3>
                <textarea
                  className="w-full px-4 py-4 bg-white/50 backdrop-blur-sm border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none transition-all"
                  rows={4}
                  placeholder="Détails techniques de l'installation, configurations, observations..."
                  value={completionData.installation_notes}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, installation_notes: e.target.value }))}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
                <Button
                  onClick={submitCompletion}
                  className="flex-1 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 shadow-lg text-white"
                  disabled={completeInstallationMutation.isPending}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {completeInstallationMutation.isPending ? "Enregistrement..." : "Valider Installation"}
                </Button>
                <Button
                  onClick={() => {
                    setShowCompleteModal(false)
                    setSelectedAppointment(null)
                  }}
                  variant="outline"
                  className="flex-1 border-2"
                  disabled={completeInstallationMutation.isPending}
                >
                  Annuler
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
                <p className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Important
                </p>
                <ul className="text-xs text-yellow-800 space-y-1">
                  <li>• Le compte agent sera automatiquement activé</li>
                  <li>• Les caméras seront créées et assignées à l'agent</li>
                  <li>• L'agent pourra se connecter et accéder à son dashboard</li>
                  <li>• Les coordonnées GPS permettront la localisation sur carte</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
