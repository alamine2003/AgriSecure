import { useState } from "react"
import client from "../api/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  Calendar, MapPin, CheckCircle, XCircle, Clock,
  Camera, Navigation, Package, AlertTriangle, Mail, Search, Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { FloatingInput } from "@/components/ui/floating-input"
import { LocationSelector } from "@/components/ui/location-selector"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"

const STATUS_CONFIG = {
  PENDING: { label: "En attente", icon: Clock, gradient: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/20", bg: "bg-amber-500/10", text: "text-amber-400" },
  SCHEDULED: { label: "Planifié", icon: Calendar, gradient: "from-sky-500 to-blue-600", shadow: "shadow-sky-500/20", bg: "bg-sky-500/10", text: "text-sky-400" },
  DONE: { label: "Terminé", icon: CheckCircle, gradient: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/20", bg: "bg-amber-500/10", text: "text-amber-400" },
  CANCELLED: { label: "Annulé", icon: XCircle, gradient: "from-rose-500 to-red-600", shadow: "shadow-rose-500/20", bg: "bg-rose-500/10", text: "text-rose-400" },
  COMPLETED: { label: "Terminé", icon: CheckCircle, gradient: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/20", bg: "bg-amber-500/10", text: "text-amber-400" },
}

export default function InstallationAppointments() {
  const [filterStatus, setFilterStatus] = useState("")
  const [search, setSearch] = useState("")
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [locationData, setLocationData] = useState(null)
  const [completionData, setCompletionData] = useState({
    latitude: "",
    longitude: "",
    installation_notes: "",
    equipment_installed: [{ name: "Caméra 1", index: 0, latitude: "", longitude: "" }]
  })

  const appointmentsQuery = useQuery({
    queryKey: ["installation-appointments"],
    queryFn: async () => {
      const res = await client.get("/surveillance/installation-appointments/")
      return Array.isArray(res.data) ? res.data : res.data?.results || []
    },
    refetchInterval: 15000,
  })

  const completeInstallationMutation = useMutation({
    mutationFn: async ({ appointmentId, data }) => {
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
      const res = await client.post(`/surveillance/installation-appointments/${appointmentId}/complete_installation/`, payload)
      return res.data
    },
    onSuccess: async () => {
      notify.success("Installation terminée", "L'agent peut maintenant accéder à son dashboard")
      setShowCompleteModal(false)
      setSelectedAppointment(null)
      setLocationData(null)
      setCompletionData({ latitude: "", longitude: "", installation_notes: "", equipment_installed: [{ name: "Caméra 1", index: 0, latitude: "", longitude: "" }] })
      await appointmentsQuery.refetch()
    },
    onError: (err) => {
      notify.error("Erreur", err?.response?.data?.detail || "Impossible de terminer l'installation")
    },
  })

  const appointments = appointmentsQuery.data || []
  const filteredAppointments = appointments.filter(a => {
    const matchesStatus = !filterStatus || a.status === filterStatus
    if (!search.trim()) return matchesStatus
    const query = search.toLowerCase()
    const matchesSearch = (
      a.agent_name?.toLowerCase().includes(query) ||
      a.agent_first_name?.toLowerCase().includes(query) ||
      a.agent_last_name?.toLowerCase().includes(query) ||
      a.commune?.toLowerCase().includes(query) ||
      a.region?.toLowerCase().includes(query)
    )
    return matchesStatus && matchesSearch
  })

  const handleCompleteInstallation = (appointment) => {
    setSelectedAppointment(appointment)
    setCompletionData({
      latitude: appointment.latitude || "",
      longitude: appointment.longitude || "",
      installation_notes: "",
      equipment_installed: [{ name: "Caméra 1", index: 0, latitude: "", longitude: "" }]
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
        { name: `Caméra ${prev.equipment_installed.length + 1}`, index: prev.equipment_installed.length, latitude: prev.latitude, longitude: prev.longitude }
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
      equipment_installed: prev.equipment_installed.map((cam, i) => i === index ? { ...cam, [field]: value } : cam)
    }))
  }

  const submitCompletion = () => {
    if (!completionData.latitude || !completionData.longitude) {
      notify.error("Erreur", "Veuillez fournir les coordonnées GPS")
      return
    }
    if (completionData.equipment_installed.length === 0) {
      notify.error("Erreur", "Veuillez ajouter au moins une caméra")
      return
    }
    completeInstallationMutation.mutate({ appointmentId: selectedAppointment.id, data: completionData })
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Non défini"
    return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const statuses = [
    { key: "", label: "Tous", count: appointments.length },
    { key: "SCHEDULED", label: "Planifiés", count: appointments.filter(a => a.status === 'SCHEDULED').length },
    { key: "COMPLETED", label: "Terminés", count: appointments.filter(a => a.status === 'COMPLETED').length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/[0.07] via-card to-blue-500/[0.04]" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-500/[0.06] rounded-full blur-[80px]" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-full text-xs font-medium text-sky-400 mb-3">
              <Calendar className="w-3.5 h-3.5" />
              Planning technique
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Rendez-vous d'installation</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Gestion des installations d'équipement de surveillance
            </p>
          </div>
        </div>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {statuses.map((s) => (
            <button
              key={s.key}
              onClick={() => setFilterStatus(s.key)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                filterStatus === s.key
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {s.label}
              <span className={cn(
                "inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-bold",
                filterStatus === s.key ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {s.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
          />
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {appointmentsQuery.isLoading ? (
          <div className="bg-card rounded-2xl border border-border/50 p-16 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3 animate-pulse">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Chargement des rendez-vous...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 p-16 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
              <Calendar className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Aucun rendez-vous</p>
            <p className="text-xs text-muted-foreground">Aucun rendez-vous ne correspond à vos filtres</p>
          </div>
        ) : (
          filteredAppointments.map((appointment) => {
            const config = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.SCHEDULED
            const Icon = config.icon

            return (
              <div key={appointment.id} className="bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/20 transition-all">
                <div className={`h-1 bg-gradient-to-r ${config.gradient}`} />
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg", config.gradient, config.shadow)}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {appointment.agent_name || `${appointment.agent_first_name || ''} ${appointment.agent_last_name || ''}`}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {appointment.commune || appointment.locality || 'Non défini'}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(appointment.scheduled_for)}
                        </span>
                      </div>
                      {appointment.notes && (
                        <p className="text-xs text-muted-foreground mt-1.5 italic">"{appointment.notes}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium", config.bg, config.text)}>
                      <Icon className="w-3.5 h-3.5" />
                      {config.label}
                    </span>
                    {(appointment.status === "PENDING" || appointment.status === "SCHEDULED") && (
                      <Button
                        onClick={() => handleCompleteInstallation(appointment)}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl shadow-lg shadow-amber-500/20 border-0"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        Terminer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal Completion */}
      {showCompleteModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-3xl w-full bg-card border border-border/50 rounded-3xl shadow-2xl my-8 overflow-hidden">
            {/* Modal header */}
            <div className="border-b border-border/50 px-6 py-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Compléter l'installation</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedAppointment.agent_name || `${selectedAppointment.agent_first_name} ${selectedAppointment.agent_last_name}`} — {selectedAppointment.commune}
                </p>
              </div>
            </div>

            {/* Modal content */}
            <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
              {/* Location */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  Localisation
                </h4>
                <LocationSelector
                  onLocationSelect={handleLocationSelect}
                  initialRegion={selectedAppointment.region}
                  initialCommune={selectedAppointment.commune || selectedAppointment.locality}
                  showGPS={true}
                />
              </div>

              {/* Manual GPS */}
              {!locationData && (
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <p className="text-xs font-medium text-amber-400 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Coordonnées GPS manuelles
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

              {/* Cameras */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Camera className="w-4 h-4 text-sky-400" />
                    Caméras ({completionData.equipment_installed.length})
                  </h4>
                  <Button onClick={addCamera} variant="outline" size="sm" className="rounded-lg border-border/50 text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Ajouter
                  </Button>
                </div>

                <div className="space-y-2">
                  {completionData.equipment_installed.map((camera, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20">
                      <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center">
                        <Camera className="w-4 h-4 text-sky-400" />
                      </div>
                      <input
                        type="text"
                        value={camera.name}
                        onChange={(e) => updateCamera(index, 'name', e.target.value)}
                        className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                        placeholder="Nom de la caméra"
                      />
                      {completionData.equipment_installed.length > 1 && (
                        <button onClick={() => removeCamera(index)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Notes techniques</h4>
                <textarea
                  className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  rows={3}
                  placeholder="Détails techniques, configurations, observations..."
                  value={completionData.installation_notes}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, installation_notes: e.target.value }))}
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="border-t border-border/50 px-6 py-4 flex gap-3">
              <Button
                onClick={submitCompletion}
                disabled={completeInstallationMutation.isPending}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl shadow-lg shadow-amber-500/20 border-0"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {completeInstallationMutation.isPending ? "Enregistrement..." : "Valider l'installation"}
              </Button>
              <Button
                onClick={() => { setShowCompleteModal(false); setSelectedAppointment(null); setLocationData(null); }}
                variant="outline"
                disabled={completeInstallationMutation.isPending}
                className="flex-1 rounded-xl border-border/50"
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
