import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import client from "../api/client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Map } from "lucide-react"
import { FieldMapDrawer } from "../components/ui/field-map-drawer"
import { DashboardMap } from "../components/ui/dashboard-map"

import { DashboardLayout } from "../components/templates/DashboardLayout"
import { StatsGrid } from "../components/organisms/StatsGrid"
import { PerimetersSection } from "../components/organisms/PerimetersSection"
import { CamerasSection } from "../components/organisms/CamerasSection"
import { AlertsSection } from "../components/organisms/AlertsSection"
import { DetectionsSection } from "../components/organisms/DetectionsSection"
import { AnalyticsSection } from "../components/organisms/AnalyticsSection"

export default function AgentDashboardModular() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [perimeterDialogOpen, setPerimeterDialogOpen] = useState(false)
  const [editingPerimeter, setEditingPerimeter] = useState(null)
  const [newPerimeter, setNewPerimeter] = useState({ name: "", description: "" })
  const [analyticsDays, setAnalyticsDays] = useState(30)

  // ========== QUERIES ==========
  const camerasQuery = useQuery({
    queryKey: ["agent-cameras"],
    queryFn: async () => {
      const res = await client.get("/surveillance/cameras/")
      return Array.isArray(res.data) ? res.data : res.data?.results || []
    },
    refetchInterval: 10000,
  })

  const perimetersQuery = useQuery({
    queryKey: ["agent-perimeters"],
    queryFn: async () => {
      const res = await client.get("/surveillance/perimeters/")
      return Array.isArray(res.data) ? res.data : res.data?.results || []
    },
    refetchInterval: 15000,
  })

  const detectionsQuery = useQuery({
    queryKey: ["agent-detections"],
    queryFn: async () => {
      const res = await client.get("/surveillance/detections/?ordering=-detected_at")
      const data = Array.isArray(res.data) ? res.data : res.data?.results || []
      return data.slice(0, 6)
    },
    refetchInterval: 5000,
  })

  const alertsQuery = useQuery({
    queryKey: ["agent-alerts"],
    queryFn: async () => {
      const res = await client.get("/surveillance/alerts/?ordering=-created_at")
      const data = Array.isArray(res.data) ? res.data : res.data?.results || []
      return data.slice(0, 4)
    },
    refetchInterval: 5000,
  })

  const analyticsQuery = useQuery({
    queryKey: ["agent-analytics", analyticsDays],
    queryFn: async () => {
      const res = await client.get(`/surveillance/dashboard/analytics/?days=${analyticsDays}`)
      return res.data
    },
    refetchInterval: 60000,
    staleTime: 30000,
  })

  // ========== MUTATIONS ==========
  const createPerimeterMutation = useMutation({
    mutationFn: async (data) => {
      const res = await client.post("/surveillance/perimeters/", data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["agent-perimeters"])
      toast.success("Périmètre créé avec succès")
      setPerimeterDialogOpen(false)
      setNewPerimeter({ name: "", description: "" })
    },
    onError: (err) => {
      const d = err?.response?.data
      const msg = d?.detail || d?.coordinates?.[0] || d?.center_lat?.[0] || d?.center_lng?.[0]
        || (d ? JSON.stringify(d) : null) || "Erreur lors de la création du périmètre"
      toast.error(msg)
    }
  })

  const updatePerimeterMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await client.patch(`/surveillance/perimeters/${id}/`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["agent-perimeters"])
      toast.success("Périmètre modifié avec succès")
      setPerimeterDialogOpen(false)
      setEditingPerimeter(null)
    },
    onError: () => toast.error("Erreur lors de la modification"),
  })

  const deletePerimeterMutation = useMutation({
    mutationFn: async (id) => { await client.delete(`/surveillance/perimeters/${id}/`) },
    onSuccess: () => {
      queryClient.invalidateQueries(["agent-perimeters"])
      toast.success("Périmètre supprimé")
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  })

  const falsePositiveMutation = useMutation({
    mutationFn: async ({ id, value }) => {
      const res = await client.patch(`/surveillance/detections/${id}/mark_false_positive/`, { is_false_positive: value })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["agent-detections"])
      queryClient.invalidateQueries(["agent-analytics"])
      toast.success(data.is_false_positive ? "Marqué comme faux positif" : "Faux positif annulé")
    },
    onError: () => toast.error("Impossible de mettre à jour"),
  })

  const resolveAlertMutation = useMutation({
    mutationFn: async (id) => {
      const res = await client.patch(`/surveillance/alerts/${id}/resolve/`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["agent-alerts"])
      queryClient.invalidateQueries(["agent-analytics"])
      toast.success("Alerte résolue")
    },
    onError: () => toast.error("Impossible de résoudre l'alerte"),
  })

  // ========== DONNÉES ==========
  const cameras = camerasQuery.data || []
  const perimeters = perimetersQuery.data || []
  const detections = detectionsQuery.data || []
  const alerts = alertsQuery.data || []

  // Utilise les données analytics (période sélectionnée) pour des comptages précis
  const analyticsQm = analyticsQuery.data?.quality_metrics

  const stats = {
    activeCameras: cameras.filter(c => c.is_active).length,
    totalCameras: cameras.length,
    totalArea: perimeters.reduce((acc, p) => acc + parseFloat(p.area_hectares || 0), 0),
    perimeterCount: perimeters.length,
    unreadAlerts: analyticsQm?.unread_alerts ?? alerts.filter(a => !a.is_read).length,
    totalAlerts: analyticsQm?.total_alerts ?? alerts.length,
    highDangerDetections: analyticsQm?.high_danger_detections ?? detections.filter(d => d.danger_level === 'HIGH').length,
    totalDetections: analyticsQm?.total_detections ?? detections.length,
  }

  // ========== HANDLERS ==========
  const handleSavePerimeter = (mapData) => {
    if (!newPerimeter.name?.trim()) { toast.error("Le nom du périmètre est requis"); return }
    const toFixed7 = (v) => (v != null ? parseFloat(v.toFixed(7)) : null)
    const payload = {
      name: newPerimeter.name.trim(),
      description: newPerimeter.description || "",
      coordinates: mapData.coordinates,
      center_lat: toFixed7(mapData.center?.lat),
      center_lng: toFixed7(mapData.center?.lng),
    }
    if (editingPerimeter) {
      updatePerimeterMutation.mutate({ id: editingPerimeter.id, data: payload })
    } else {
      createPerimeterMutation.mutate(payload)
    }
  }

  const handleEditPerimeter = (perimeter) => {
    setEditingPerimeter(perimeter)
    setNewPerimeter({ name: perimeter.name, description: perimeter.description || "" })
    setPerimeterDialogOpen(true)
  }

  const handleDeletePerimeter = (id) => {
    if (window.confirm("Supprimer ce périmètre ?")) deletePerimeterMutation.mutate(id)
  }

  const handleNewPerimeter = () => {
    setEditingPerimeter(null)
    setNewPerimeter({ name: "", description: "" })
    setPerimeterDialogOpen(true)
  }

  const handleViewCamera = (cameraId) => navigate(`/surveillance?camera=${cameraId}`)
  const handleSurveillance = () => navigate("/surveillance")

  const handleFalsePositive = (id, value) => falsePositiveMutation.mutate({ id, value })
  const handleResolveAlert = (id) => resolveAlertMutation.mutate(id)

  const handleExportCSV = async () => {
    try {
      const res = await client.get("/surveillance/detections/export_csv/", { responseType: "blob" })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv;charset=utf-8;" }))
      const a = document.createElement("a")
      a.href = url
      a.download = `detections_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success("Export CSV téléchargé")
    } catch {
      toast.error("Erreur lors de l'export")
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    if (minutes < 1) return "À l'instant"
    if (minutes < 60) return `${minutes}min`
    if (hours < 24) return `${hours}h`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  // ========== RENDER ==========
  return (
    <>
      <DashboardLayout
        onNewPerimeter={handleNewPerimeter}
        onSurveillance={handleSurveillance}
      >
        <div className="mb-6">
          <StatsGrid stats={stats} />
        </div>

        <div className="space-y-4">
          {/* Row 1: Périmètres + Alertes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <PerimetersSection
                perimeters={perimeters}
                isLoading={perimetersQuery.isLoading}
                onEdit={handleEditPerimeter}
                onDelete={handleDeletePerimeter}
                onNew={handleNewPerimeter}
              />
            </div>
            <div className="lg:col-span-1">
              <AlertsSection
                alerts={alerts}
                isLoading={alertsQuery.isLoading}
                unreadCount={stats.unreadAlerts}
                formatDate={formatDate}
                onResolve={handleResolveAlert}
              />
            </div>
          </div>

          {/* Row 2: Caméras + Détections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <CamerasSection
                cameras={cameras}
                isLoading={camerasQuery.isLoading}
                activeCameras={stats.activeCameras}
                onView={handleViewCamera}
              />
            </div>
            <div className="lg:col-span-1">
              <DetectionsSection
                detections={detections}
                isLoading={detectionsQuery.isLoading}
                formatDate={formatDate}
                onFalsePositive={handleFalsePositive}
              />
            </div>
          </div>

          {/* Row 3: Analytics */}
          <AnalyticsSection
            analytics={analyticsQuery.data}
            isLoading={analyticsQuery.isLoading}
            days={analyticsDays}
            onDaysChange={setAnalyticsDays}
            onExportCSV={handleExportCSV}
          />

          {/* Row 4: Carte */}
          <DashboardMap
            perimeters={perimeters}
            cameras={cameras}
            height="380px"
            title="Mes périmètres & caméras"
            icon={Map}
          />
        </div>
      </DashboardLayout>

      <Dialog open={perimeterDialogOpen} onOpenChange={setPerimeterDialogOpen}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden bg-card border-border/50">
          <DialogHeader className="px-6 py-4 border-b border-border/50 bg-card">
            <DialogTitle className="flex items-center gap-2 text-base text-foreground">
              <Map className="w-5 h-5 text-primary" />
              {editingPerimeter ? "Modifier le Périmètre" : "Nouveau Périmètre"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col h-[calc(90vh-5rem)] overflow-hidden">
            <div className="shrink-0 border-b border-border/50 bg-muted/20 px-4 py-3 flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[180px]">
                <Label htmlFor="name" className="text-foreground text-xs font-semibold">Nom du Périmètre *</Label>
                <Input
                  id="name"
                  value={newPerimeter.name}
                  onChange={(e) => setNewPerimeter({ ...newPerimeter, name: e.target.value })}
                  placeholder="Ex: Champ Principal"
                  className="mt-1 h-8 text-sm bg-card border-border/50 text-foreground"
                />
              </div>
              <div className="flex-[2] min-w-[220px]">
                <Label htmlFor="description" className="text-foreground text-xs font-semibold">Description <span className="font-normal text-muted-foreground">(optionnel)</span></Label>
                <Input
                  id="description"
                  value={newPerimeter.description}
                  onChange={(e) => setNewPerimeter({ ...newPerimeter, description: e.target.value })}
                  placeholder="Informations supplémentaires..."
                  className="mt-1 h-8 text-sm bg-card border-border/50 text-foreground"
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 p-3">
              <FieldMapDrawer
                onSave={handleSavePerimeter}
                initialPolygon={editingPerimeter?.coordinates ?? []}
                height="100%"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
