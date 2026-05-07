import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import client from "../api/client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Camera, MapPin, AlertTriangle, Activity, Eye, Zap, Shield, Clock,
  CheckCircle, Sparkles, Navigation, Wifi, WifiOff, Map, Plus, X,
  Edit2, Trash2, Save, Maximize2, ZoomIn, ZoomOut, RotateCcw,
  MapPinned, Target, Layers
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { FieldMapDrawer } from "../components/ui/field-map-drawer"

export default function AgentDashboardUnified() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedCamera, setSelectedCamera] = useState(null)
  const [perimeterDialogOpen, setPerimeterDialogOpen] = useState(false)
  const [editingPerimeter, setEditingPerimeter] = useState(null)
  const [newPerimeter, setNewPerimeter] = useState({ name: "", description: "" })

  // Queries
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
      return data.slice(0, 6) // 6 dernières
    },
    refetchInterval: 5000,
  })

  const alertsQuery = useQuery({
    queryKey: ["agent-alerts"],
    queryFn: async () => {
      const res = await client.get("/surveillance/alerts/?ordering=-created_at")
      const data = Array.isArray(res.data) ? res.data : res.data?.results || []
      return data.slice(0, 4) // 4 dernières
    },
    refetchInterval: 5000,
  })

  // Mutations
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

  const cameras = camerasQuery.data || []
  const perimeters = perimetersQuery.data || []
  const detections = detectionsQuery.data || []
  const alerts = alertsQuery.data || []

  // Stats
  const activeCameras = cameras.filter(c => c.is_active).length
  const totalArea = perimeters.reduce((acc, p) => acc + (p.area_hectares || 0), 0)
  const unreadAlerts = alerts.filter(a => !a.is_read).length
  const highDangerDetections = detections.filter(d => d.danger_level === 'HIGH').length

  const handleSavePerimeter = (mapData) => {
    const payload = {
      name: newPerimeter.name || "Nouveau Périmètre",
      description: newPerimeter.description || "",
      coordinates: mapData.coordinates,
      area_hectares: mapData.area,
      center_latitude: mapData.center.lat,
      center_longitude: mapData.center.lng,
      commune: mapData.commune || "",
      region: mapData.region || "",
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

  const openNewPerimeterDialog = () => {
    setEditingPerimeter(null)
    setNewPerimeter({ name: "", description: "" })
    setPerimeterDialogOpen(true)
  }

  const dangerConfig = {
    HIGH: { label: "Élevé", color: "from-red-500 to-rose-600", icon: AlertTriangle, bg: "bg-red-500" },
    MEDIUM: { label: "Moyen", color: "from-orange-500 to-amber-600", icon: Zap, bg: "bg-orange-500" },
    LOW: { label: "Faible", color: "from-green-500 to-emerald-600", icon: CheckCircle, bg: "bg-green-500" },
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

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header - Fixed */}
      <div className="h-20 border-b bg-white/90 backdrop-blur-xl shadow-sm px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur-md opacity-40"></div>
            <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Agent</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
              Monitoring en temps réel
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={openNewPerimeterDialog}
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nouveau Périmètre
          </Button>
          <Button
            onClick={() => navigate("/surveillance")}
            size="sm"
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Surveillance Live
          </Button>
        </div>
      </div>

      {/* Main Content - Grid Layout */}
      <div className="h-[calc(100vh-5rem)] overflow-y-auto p-6">
        <div className="max-w-[1600px] mx-auto">
          {/* Stats Row - Compact */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-90 mb-1">Caméras Actives</p>
                    <p className="text-3xl font-bold">{activeCameras}</p>
                    <p className="text-xs opacity-75">sur {cameras.length}</p>
                  </div>
                  <Camera className="w-10 h-10 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-90 mb-1">Surface Totale</p>
                    <p className="text-3xl font-bold">{totalArea.toFixed(1)}</p>
                    <p className="text-xs opacity-75">{perimeters.length} périmètre(s)</p>
                  </div>
                  <Map className="w-10 h-10 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-90 mb-1">Alertes Non Lues</p>
                    <p className="text-3xl font-bold">{unreadAlerts}</p>
                    <p className="text-xs opacity-75">sur {alerts.length}</p>
                  </div>
                  <AlertTriangle className="w-10 h-10 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-90 mb-1">Danger Élevé</p>
                    <p className="text-3xl font-bold">{highDangerDetections}</p>
                    <p className="text-xs opacity-75">sur {detections.length}</p>
                  </div>
                  <Shield className="w-10 h-10 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Grid - 2 Rows */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* Périmètres - Colonne Large */}
            <Card className="col-span-2 bg-white/95 backdrop-blur border-gray-200 shadow-lg">
              <CardHeader className="pb-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Map className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">Mes Périmètres</CardTitle>
                    <Badge className="bg-blue-100 text-blue-700 border-0">{perimeters.length}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 h-[280px] overflow-y-auto">
                {perimetersQuery.isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Map className="w-12 h-12 text-blue-400 animate-pulse" />
                  </div>
                ) : perimeters.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MapPinned className="w-16 h-16 text-gray-300 mb-3" />
                    <p className="font-semibold text-gray-900 mb-1">Aucun périmètre</p>
                    <p className="text-xs text-gray-500 mb-3">Dessinez votre premier périmètre agricole</p>
                    <Button onClick={openNewPerimeterDialog} size="sm" className="bg-blue-500 hover:bg-blue-600">
                      <Plus className="w-4 h-4 mr-1" />
                      Créer un Périmètre
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {perimeters.map((perimeter) => (
                      <Card key={perimeter.id} className="border-2 hover:shadow-md transition-all bg-gradient-to-br from-white to-blue-50/30">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm text-gray-900 truncate">{perimeter.name}</h4>
                              <p className="text-xs text-gray-500 truncate">{perimeter.commune || "Non localisé"}</p>
                            </div>
                            <div className="p-1.5 rounded-lg bg-blue-100">
                              <Target className="w-4 h-4 text-blue-600" />
                            </div>
                          </div>

                          <div className="space-y-1.5 mb-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Surface:</span>
                              <span className="font-bold text-blue-600">{perimeter.area_hectares?.toFixed(2) || "0.00"} ha</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Points GPS:</span>
                              <span className="font-mono text-gray-900">{perimeter.coordinates?.length || 0}</span>
                            </div>
                          </div>

                          <div className="flex gap-1.5">
                            <Button
                              onClick={() => handleEditPerimeter(perimeter)}
                              size="sm"
                              variant="outline"
                              className="flex-1 h-7 text-xs"
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              onClick={() => handleDeletePerimeter(perimeter.id)}
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alertes */}
            <Card className="bg-white/95 backdrop-blur border-gray-200 shadow-lg">
              <CardHeader className="pb-3 border-b bg-gradient-to-r from-red-50 to-rose-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <CardTitle className="text-lg">Alertes</CardTitle>
                  </div>
                  <Badge className="bg-red-100 text-red-700 border-0">{unreadAlerts}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 h-[280px] overflow-y-auto space-y-2">
                {alertsQuery.isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Activity className="w-12 h-12 text-red-400 animate-pulse" />
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Shield className="w-12 h-12 text-gray-300 mb-2" />
                    <p className="text-xs text-gray-500">Aucune alerte</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-2.5 rounded-lg border transition-all ${
                        alert.is_read
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`p-1 rounded ${alert.is_read ? 'bg-gray-200' : 'bg-red-500'}`}>
                          <AlertTriangle className={`w-3 h-3 ${alert.is_read ? 'text-gray-600' : 'text-white'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{alert.message}</p>
                          <p className="text-xs text-gray-500">{formatDate(alert.created_at)}</p>
                        </div>
                        {!alert.is_read && (
                          <Badge className="bg-red-500 text-white text-xs h-4 px-1.5">New</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Caméras */}
            <Card className="col-span-2 bg-white/95 backdrop-blur border-gray-200 shadow-lg">
              <CardHeader className="pb-3 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-emerald-600" />
                    <CardTitle className="text-lg">Mes Caméras</CardTitle>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0">{activeCameras} actives</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 h-[280px] overflow-y-auto">
                {camerasQuery.isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Camera className="w-12 h-12 text-emerald-400 animate-pulse" />
                  </div>
                ) : cameras.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Camera className="w-16 h-16 text-gray-300 mb-3" />
                    <p className="font-semibold text-gray-900 mb-1">Aucune caméra</p>
                    <p className="text-xs text-gray-500">En attente d'installation</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {cameras.map((camera) => (
                      <Card key={camera.id} className="border-2 hover:shadow-md transition-all bg-gradient-to-br from-white to-emerald-50/30">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`p-2 rounded-lg ${camera.is_active ? 'bg-emerald-100' : 'bg-gray-200'}`}>
                              {camera.is_active ? (
                                <Wifi className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <WifiOff className="w-5 h-5 text-gray-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm text-gray-900 truncate">{camera.name}</h4>
                              <Badge className={`text-xs h-5 ${camera.is_active ? 'bg-emerald-500' : 'bg-gray-400'} text-white border-0`}>
                                {camera.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>

                          {camera.location && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{camera.location}</span>
                            </div>
                          )}

                          <Button
                            onClick={() => navigate(`/surveillance?camera=${camera.id}`)}
                            size="sm"
                            className="w-full h-7 text-xs bg-emerald-500 hover:bg-emerald-600"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Voir
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Détections */}
            <Card className="bg-white/95 backdrop-blur border-gray-200 shadow-lg">
              <CardHeader className="pb-3 border-b bg-gradient-to-r from-orange-50 to-amber-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-orange-600" />
                    <CardTitle className="text-lg">Détections</CardTitle>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700 border-0">{detections.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 h-[280px] overflow-y-auto space-y-2">
                {detectionsQuery.isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Activity className="w-12 h-12 text-orange-400 animate-pulse" />
                  </div>
                ) : detections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Eye className="w-12 h-12 text-gray-300 mb-2" />
                    <p className="text-xs text-gray-500">Aucune détection</p>
                  </div>
                ) : (
                  detections.map((detection) => {
                    const config = dangerConfig[detection.danger_level]
                    const DangerIcon = config.icon

                    return (
                      <div key={detection.id} className="p-2.5 rounded-lg border-2 border-gray-100 bg-white hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={`bg-gradient-to-r ${config.color} text-white text-xs border-0`}>
                            <DangerIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                          <span className="text-xs text-gray-500">{formatDate(detection.detected_at)}</span>
                        </div>
                        <h5 className="font-bold text-sm text-gray-900 mb-1">{detection.label}</h5>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Confiance:</span>
                          <span className="font-bold text-gray-900">{(detection.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog pour Nouveau/Modifier Périmètre */}
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
                    <li className="flex items-start gap-2">
                      <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Cliquez sur la carte pour ajouter des points</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Edit2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Glissez les points pour modifier</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Save className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Cliquez "Terminer" puis "Enregistrer"</span>
                    </li>
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
    </div>
  )
}
