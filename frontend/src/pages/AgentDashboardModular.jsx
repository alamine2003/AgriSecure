import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import client from "../api/client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Map } from "lucide-react"
import { FieldMapDrawer } from "../components/ui/field-map-drawer"
import { DashboardMap } from "../components/ui/dashboard-map"

// Import des composants modulaires
import { DashboardLayout } from "../components/templates/DashboardLayout"
import { StatsGrid } from "../components/organisms/StatsGrid"
import { PerimetersSection } from "../components/organisms/PerimetersSection"
import { CamerasSection } from "../components/organisms/CamerasSection"
import { AlertsSection } from "../components/organisms/AlertsSection"
import { DetectionsSection } from "../components/organisms/DetectionsSection"

/**
 * Page Agent Dashboard - Version Modulaire
 * Architecture: Atomic Design (Atoms → Molecules → Organisms → Templates → Pages)
 */
export default function AgentDashboardModular() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // États locaux
  const [perimeterDialogOpen, setPerimeterDialogOpen] = useState(false)
  const [editingPerimeter, setEditingPerimeter] = useState(null)
  const [newPerimeter, setNewPerimeter] = useState({ name: "", description: "" })

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
    onError: () => {
      toast.error("Erreur lors de la création du périmètre")
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
    onError: () => {
      toast.error("Erreur lors de la modification")
    }
  })

  const deletePerimeterMutation = useMutation({
    mutationFn: async (id) => {
      await client.delete(`/surveillance/perimeters/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["agent-perimeters"])
      toast.success("Périmètre supprimé")
    },
    onError: () => {
      toast.error("Erreur lors de la suppression")
    }
  })

  // ========== DONNÉES ==========
  const cameras = camerasQuery.data || []
  const perimeters = perimetersQuery.data || []
  const detections = detectionsQuery.data || []
  const alerts = alertsQuery.data || []

  // ========== STATS CALCULÉES ==========
  const stats = {
    activeCameras: cameras.filter(c => c.is_active).length,
    totalCameras: cameras.length,
    totalArea: perimeters.reduce((acc, p) => acc + parseFloat(p.area_hectares || 0), 0),
    perimeterCount: perimeters.length,
    unreadAlerts: alerts.filter(a => !a.is_read).length,
    totalAlerts: alerts.length,
    highDangerDetections: detections.filter(d => d.danger_level === 'HIGH').length,
    totalDetections: detections.length,
  }

  // ========== HANDLERS ==========
  const handleSavePerimeter = (mapData) => {
    const payload = {
      name: newPerimeter.name || "Nouveau Périmètre",
      description: newPerimeter.description || "",
      coordinates: mapData.coordinates,
      area_hectares: mapData.area_hectares ?? mapData.area,
      center_lat: mapData.center?.lat,
      center_lng: mapData.center?.lng,
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
    if (window.confirm("Supprimer ce périmètre ?")) {
      deletePerimeterMutation.mutate(id)
    }
  }

  const handleNewPerimeter = () => {
    setEditingPerimeter(null)
    setNewPerimeter({ name: "", description: "" })
    setPerimeterDialogOpen(true)
  }

  const handleViewCamera = (cameraId) => {
    navigate(`/surveillance?camera=${cameraId}`)
  }

  const handleSurveillance = () => {
    navigate("/surveillance")
  }

  // ========== UTILITAIRES ==========
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
        {/* Stats Row */}
        <div className="mb-6">
          <StatsGrid stats={stats} />
        </div>

        {/* Main Grid - 2 Rows */}
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
              />
            </div>
          </div>

          {/* Row 3: Carte des périmètres */}
          <DashboardMap
            perimeters={perimeters}
            cameras={cameras}
            height="380px"
            title="Mes périmètres & caméras"
            icon={Map}
          />
        </div>
      </DashboardLayout>

      {/* Dialog Périmètre */}
      <Dialog open={perimeterDialogOpen} onOpenChange={setPerimeterDialogOpen}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Map className="w-6 h-6 text-blue-600" />
              {editingPerimeter ? "Modifier le Périmètre" : "Nouveau Périmètre"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 h-[calc(90vh-5rem)]">
            {/* Formulaire - Sidebar */}
            <div className="col-span-1 border-r bg-gray-50 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom du Périmètre *</Label>
                  <Input
                    id="name"
                    value={newPerimeter.name}
                    onChange={(e) => setNewPerimeter({ ...newPerimeter, name: e.target.value })}
                    placeholder="Ex: Champ Principal"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newPerimeter.description}
                    onChange={(e) => setNewPerimeter({ ...newPerimeter, description: e.target.value })}
                    placeholder="Informations supplémentaires..."
                    rows={3}
                    className="mt-1.5"
                  />
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Instructions:</p>
                  <ul className="text-xs text-gray-600 space-y-1.5">
                    <li>• Cliquez sur la carte pour ajouter des points</li>
                    <li>• Glissez les points pour modifier</li>
                    <li>• Cliquez "Terminer" puis "Enregistrer"</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Carte - Main Area */}
            <div className="col-span-2 relative">
              <FieldMapDrawer
                onSave={handleSavePerimeter}
                existingCoordinates={editingPerimeter?.coordinates}
                compact={true}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
