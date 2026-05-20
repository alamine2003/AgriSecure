import { useState } from "react"
import client from "../api/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  Calendar, MapPin, CheckCircle, XCircle, Clock,
  Camera, Navigation, AlertTriangle, Search, Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LocationSelector } from "@/components/ui/location-selector"
import { MapPointPicker } from "@/components/ui/map-point-picker"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"

const STATUS_CONFIG = {
  PENDING:   { label: "En attente", icon: Clock,       gradient: "from-amber-500 to-orange-500",  shadow: "shadow-amber-500/20", bg: "bg-amber-500/10", text: "text-amber-400" },
  SCHEDULED: { label: "Planifié",   icon: Calendar,    gradient: "from-sky-500 to-blue-600",       shadow: "shadow-sky-500/20",   bg: "bg-sky-500/10",   text: "text-sky-400"   },
  DONE:      { label: "Terminé",    icon: CheckCircle, gradient: "from-emerald-500 to-green-600",  shadow: "shadow-emerald-500/20",bg:"bg-emerald-500/10",text:"text-emerald-400"},
  CANCELLED: { label: "Annulé",    icon: XCircle,     gradient: "from-rose-500 to-red-600",       shadow: "shadow-rose-500/20",   bg: "bg-rose-500/10",   text: "text-rose-400"  },
  COMPLETED: { label: "Terminé",   icon: CheckCircle, gradient: "from-emerald-500 to-green-600",  shadow: "shadow-emerald-500/20",bg:"bg-emerald-500/10",text:"text-emerald-400"},
}

const SENEGAL_CENTER = { lat: 14.4974, lng: -14.4524 }

export default function InstallationAppointments() {
  const [filterStatus, setFilterStatus] = useState("")
  const [search, setSearch] = useState("")
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [mapCenter, setMapCenter] = useState(SENEGAL_CENTER)
  const [completionData, setCompletionData] = useState({
    latitude: "",
    longitude: "",
    installation_notes: "",
    equipment_installed: [{ name: "Caméra 1", index: 0 }]
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
      const lat = parseFloat(data.latitude)
      const lng = parseFloat(data.longitude)
      const payload = {
        ...data,
        latitude: lat,
        longitude: lng,
        equipment_installed: data.equipment_installed.map((eq, i) => ({
          ...eq,
          index: i,
          latitude: lat,
          longitude: lng,
        })),
      }
      const res = await client.post(
        `/surveillance/installation-appointments/${appointmentId}/complete_installation/`,
        payload
      )
      return res.data
    },
    onSuccess: async () => {
      notify.success("Installation terminée", "L'agent peut maintenant accéder à son dashboard")
      closeModal()
      await appointmentsQuery.refetch()
    },
    onError: (err) => {
      notify.error("Erreur", err?.response?.data?.detail || "Impossible de terminer l'installation")
    },
  })

  const appointments = appointmentsQuery.data || []
  const filtered = appointments.filter(a => {
    const matchStatus = !filterStatus || a.status === filterStatus
    if (!search.trim()) return matchStatus
    const q = search.toLowerCase()
    return matchStatus && (
      a.agent_name?.toLowerCase().includes(q) ||
      a.agent_first_name?.toLowerCase().includes(q) ||
      a.agent_last_name?.toLowerCase().includes(q) ||
      a.commune?.toLowerCase().includes(q) ||
      a.region?.toLowerCase().includes(q)
    )
  })

  const openModal = (appt) => {
    setSelectedAppointment(appt)
    const lat = appt.latitude ? parseFloat(appt.latitude) : null
    const lng = appt.longitude ? parseFloat(appt.longitude) : null
    setCompletionData({
      latitude: lat?.toString() || "",
      longitude: lng?.toString() || "",
      installation_notes: "",
      equipment_installed: [{ name: "Caméra 1", index: 0 }],
    })
    if (lat && lng) setMapCenter({ lat, lng })
    else setMapCenter(SENEGAL_CENTER)
    setShowCompleteModal(true)
  }

  const closeModal = () => {
    setShowCompleteModal(false)
    setSelectedAppointment(null)
    setMapCenter(SENEGAL_CENTER)
    setCompletionData({ latitude: "", longitude: "", installation_notes: "", equipment_installed: [{ name: "Caméra 1", index: 0 }] })
  }

  const handleLocationSelect = (location) => {
    if (location?.gps) {
      const { lat, lng } = location.gps
      setMapCenter({ lat, lng })
      setCompletionData(prev => ({ ...prev, latitude: lat.toString(), longitude: lng.toString() }))
    }
  }

  const handleMapSelect = ({ lat, lng }) => {
    setCompletionData(prev => ({ ...prev, latitude: lat.toString(), longitude: lng.toString() }))
  }

  const addCamera = () => {
    setCompletionData(prev => ({
      ...prev,
      equipment_installed: [
        ...prev.equipment_installed,
        { name: `Caméra ${prev.equipment_installed.length + 1}`, index: prev.equipment_installed.length },
      ],
    }))
  }

  const removeCamera = (i) => {
    setCompletionData(prev => ({
      ...prev,
      equipment_installed: prev.equipment_installed.filter((_, idx) => idx !== i),
    }))
  }

  const updateCamera = (i, value) => {
    setCompletionData(prev => ({
      ...prev,
      equipment_installed: prev.equipment_installed.map((c, idx) =>
        idx === i ? { ...c, name: value } : c
      ),
    }))
  }

  const submitCompletion = () => {
    if (!completionData.latitude || !completionData.longitude) {
      notify.error("Position requise", "Cliquez sur la carte pour sélectionner l'emplacement de l'installation.")
      return
    }
    if (completionData.equipment_installed.length === 0) {
      notify.error("Erreur", "Veuillez ajouter au moins une caméra.")
      return
    }
    completeInstallationMutation.mutate({ appointmentId: selectedAppointment.id, data: completionData })
  }

  const formatDate = (d) => {
    if (!d) return "Non défini"
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const statuses = [
    { key: "",          label: "Tous",      count: appointments.length },
    { key: "SCHEDULED", label: "Planifiés", count: appointments.filter(a => a.status === 'SCHEDULED').length },
    { key: "COMPLETED", label: "Terminés",  count: appointments.filter(a => a.status === 'COMPLETED').length },
  ]

  return (
    <div className="space-y-4">
      {/* Header compact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-full text-xs font-medium text-sky-400 mb-1">
            <Calendar className="w-3 h-3" />
            Planning technique
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Rendez-vous d'installation</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Gestion des installations de caméras de surveillance</p>
        </div>

        {/* Filtres + recherche */}
        <div className="flex flex-wrap items-center gap-2">
          {statuses.map((s) => (
            <button
              key={s.key}
              onClick={() => setFilterStatus(s.key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                filterStatus === s.key
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
              <span className={cn(
                "inline-flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold",
                filterStatus === s.key ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {s.count}
              </span>
            </button>
          ))}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-card border border-border/50 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 w-44 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {appointmentsQuery.isLoading ? (
          <div className="bg-card rounded-xl border border-border/50 p-12 text-center">
            <Calendar className="w-8 h-8 mx-auto text-primary/30 mb-2 animate-pulse" />
            <p className="text-sm text-muted-foreground">Chargement…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-xl border border-border/50 p-12 text-center">
            <Calendar className="w-10 h-10 mx-auto text-muted-foreground/20 mb-2" />
            <p className="text-sm font-medium text-foreground">Aucun rendez-vous</p>
            <p className="text-xs text-muted-foreground mt-1">Aucun résultat pour ces filtres</p>
          </div>
        ) : filtered.map((appt) => {
          const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.SCHEDULED
          const Icon = cfg.icon
          return (
            <div key={appt.id} className="bg-card rounded-xl border border-border/50 overflow-hidden hover:border-primary/20 transition-all">
              <div className={`h-0.5 bg-gradient-to-r ${cfg.gradient}`} />
              <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md shrink-0", cfg.gradient, cfg.shadow)}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {appt.agent_name || `${appt.agent_first_name || ''} ${appt.agent_last_name || ''}`.trim()}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {appt.commune || appt.locality || 'Non défini'}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(appt.scheduled_for)}
                      </span>
                    </div>
                    {appt.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{appt.notes}"</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium", cfg.bg, cfg.text)}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                  {(appt.status === "PENDING" || appt.status === "SCHEDULED") && (
                    <Button
                      onClick={() => openModal(appt)}
                      size="sm"
                      variant="gradient"
                      className="rounded-lg border-0 text-xs h-8"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Terminer
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showCompleteModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-card border border-border/50 rounded-2xl shadow-2xl my-6 overflow-hidden">

            {/* En-tête modal */}
            <div className="border-b border-border/50 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                  <CheckCircle className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Compléter l'installation</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedAppointment.agent_name || `${selectedAppointment.agent_first_name} ${selectedAppointment.agent_last_name}`}
                    {selectedAppointment.commune && ` — ${selectedAppointment.commune}`}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Corps modal */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">

              {/* Sélecteur région/commune */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-primary" />
                  Région / Commune
                </p>
                <LocationSelector
                  onLocationSelect={handleLocationSelect}
                  initialRegion={selectedAppointment.region}
                  initialCommune={selectedAppointment.commune || selectedAppointment.locality}
                  showGPS={true}
                />
              </div>

              {/* Carte interactive */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Position exacte de l'installation
                  {!completionData.latitude && (
                    <span className="ml-1 text-amber-400 font-normal">(requis)</span>
                  )}
                </p>
                <MapPointPicker
                  height="240px"
                  centerLat={mapCenter.lat}
                  centerLng={mapCenter.lng}
                  initialZoom={mapCenter.lat === SENEGAL_CENTER.lat ? 7 : 13}
                  value={
                    completionData.latitude && completionData.longitude
                      ? { lat: parseFloat(completionData.latitude), lng: parseFloat(completionData.longitude) }
                      : null
                  }
                  onSelect={handleMapSelect}
                />
              </div>

              {/* Caméras */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-sky-400" />
                    Caméras installées ({completionData.equipment_installed.length})
                  </p>
                  <Button onClick={addCamera} variant="outline" size="sm" className="rounded-lg border-border/50 text-xs h-7 px-2.5">
                    <Plus className="w-3 h-3 mr-1" />
                    Ajouter
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {completionData.equipment_installed.map((cam, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-muted/20">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
                        <Camera className="w-3.5 h-3.5 text-sky-400" />
                      </div>
                      <input
                        type="text"
                        value={cam.name}
                        onChange={(e) => updateCamera(i, e.target.value)}
                        className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                        placeholder="Nom de la caméra"
                      />
                      {completionData.equipment_installed.length > 1 && (
                        <button
                          onClick={() => removeCamera(i)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Notes techniques</p>
                <textarea
                  className="w-full px-3 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  rows={3}
                  placeholder="Détails techniques, configurations, observations…"
                  value={completionData.installation_notes}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, installation_notes: e.target.value }))}
                />
              </div>

              {/* Alerte si pas de position */}
              {!completionData.latitude && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Sélectionnez la position sur la carte avant de valider.
                </div>
              )}
            </div>

            {/* Pied modal */}
            <div className="border-t border-border/50 px-5 py-3 flex gap-2">
              <Button
                onClick={submitCompletion}
                disabled={completeInstallationMutation.isPending || !completionData.latitude}
                variant="gradient"
                className="flex-1 rounded-xl border-0"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {completeInstallationMutation.isPending ? "Enregistrement…" : "Valider l'installation"}
              </Button>
              <Button
                onClick={closeModal}
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
