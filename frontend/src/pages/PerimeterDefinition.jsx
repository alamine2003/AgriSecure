import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import client from "../api/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  Map, MapPin, Save, Trash2, Eye, EyeOff, Plus, Edit,
  Navigation, Sparkles, AlertTriangle, CheckCircle, Home
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FloatingInput } from "@/components/ui/floating-input"
import { notify } from "@/lib/notify"

export default function PerimeterDefinition() {
  const navigate = useNavigate()
  const [perimeters, setPerimeters] = useState([])
  const [editingPerimeter, setEditingPerimeter] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const perimetersQuery = useQuery({
    queryKey: ["perimeters"],
    queryFn: async () => {
      const res = await client.get("/surveillance/perimeters/")
      const data = Array.isArray(res.data) ? res.data : res.data?.results || []
      setPerimeters(data)
      return data
    },
  })

  const createPerimeterMutation = useMutation({
    mutationFn: async (data) => {
      const res = await client.post("/surveillance/perimeters/", data)
      return res.data
    },
    onSuccess: async () => {
      notify.success("Périmètre créé", "Votre périmètre agricole a été enregistré")
      setShowForm(false)
      setCurrentPoints([])
      setFormData({ name: "", description: "" })
      await perimetersQuery.refetch()
    },
    onError: (err) => {
      notify.error("Erreur", err?.response?.data?.detail || "Impossible de créer le périmètre")
    },
  })

  const updatePerimeterMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await client.patch(`/surveillance/perimeters/${id}/`, data)
      return res.data
    },
    onSuccess: async () => {
      notify.success("Périmètre mis à jour", "Les modifications ont été enregistrées")
      setEditingPerimeter(null)
      setCurrentPoints([])
      await perimetersQuery.refetch()
    },
    onError: (err) => {
      notify.error("Erreur", err?.response?.data?.detail || "Impossible de mettre à jour")
    },
  })

  const deletePerimeterMutation = useMutation({
    mutationFn: async (id) => {
      await client.delete(`/surveillance/perimeters/${id}/`)
    },
    onSuccess: async () => {
      notify.success("Périmètre supprimé", "Le périmètre a été supprimé")
      await perimetersQuery.refetch()
    },
    onError: () => {
      notify.error("Erreur", "Impossible de supprimer le périmètre")
    },
  })

  const startDrawing = () => {
    setIsDrawing(true)
    setCurrentPoints([])
    setShowForm(false)
  }

  const addPoint = (lat, lng) => {
    if (isDrawing) {
      setCurrentPoints(prev => [...prev, [lat, lng]])
    }
  }

  const removeLastPoint = () => {
    setCurrentPoints(prev => prev.slice(0, -1))
  }

  const finishDrawing = () => {
    if (currentPoints.length < 3) {
      notify.warning("Points insuffisants", "Vous devez placer au moins 3 points pour former un périmètre")
      return
    }
    setIsDrawing(false)
    setShowForm(true)
  }

  const cancelDrawing = () => {
    setIsDrawing(false)
    setCurrentPoints([])
    setShowForm(false)
  }

  const calculateArea = (points) => {
    if (points.length < 3) return 0

    let area = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      area += points[i][0] * points[j][1]
      area -= points[j][0] * points[i][1]
    }
    area = Math.abs(area) / 2
    // Conversion approximative en hectares
    return (area * 111.32 * 111.32 * 100).toFixed(2)
  }

  const calculateCenter = (points) => {
    if (points.length === 0) return [0, 0]
    const sumLat = points.reduce((acc, p) => acc + p[0], 0)
    const sumLng = points.reduce((acc, p) => acc + p[1], 0)
    return [sumLat / points.length, sumLng / points.length]
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      notify.error("Erreur", "Veuillez donner un nom au périmètre")
      return
    }

    const center = calculateCenter(currentPoints)
    const area = calculateArea(currentPoints)

    const payload = {
      name: formData.name,
      description: formData.description,
      coordinates: currentPoints,
      center_lat: center[0],
      center_lng: center[1],
      area_hectares: parseFloat(area),
    }

    if (editingPerimeter) {
      updatePerimeterMutation.mutate({ id: editingPerimeter.id, data: payload })
    } else {
      createPerimeterMutation.mutate(payload)
    }
  }

  const handleEdit = (perimeter) => {
    setEditingPerimeter(perimeter)
    setCurrentPoints(perimeter.coordinates || [])
    setFormData({
      name: perimeter.name,
      description: perimeter.description || "",
    })
    setIsDrawing(true)
  }

  const handleDelete = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce périmètre ?")) {
      deletePerimeterMutation.mutate(id)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6 space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl">
                <Map className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-blue-900 bg-clip-text text-transparent">
                Définition Périmètre Agricole
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Délimitez votre zone de surveillance avec précision GPS
              </p>
            </div>
          </div>

          <Button
            onClick={() => navigate("/agent/dashboard")}
            variant="outline"
            className="border-2"
          >
            <Home className="w-4 h-4 mr-2" />
            Retour Dashboard
          </Button>
        </div>
      </div>

      {/* Mes Périmètres */}
      <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl">
        <CardHeader className="border-b-2 border-dashed">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-600" />
                Mes Périmètres ({perimeters.length})
              </CardTitle>
              <CardDescription>Zones de surveillance définies avec coordonnées GPS</CardDescription>
            </div>
            <Button
              onClick={startDrawing}
              className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 shadow-lg"
              disabled={isDrawing}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Périmètre
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {perimetersQuery.isLoading ? (
            <div className="text-center py-12">
              <Map className="w-16 h-16 mx-auto mb-4 animate-pulse text-blue-600" />
              <p className="text-muted-foreground font-medium">Chargement des périmètres...</p>
            </div>
          ) : perimeters.length === 0 && !isDrawing ? (
            <div className="text-center py-12">
              <Map className="w-20 h-20 mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-bold text-gray-900 mb-2">Aucun périmètre défini</p>
              <p className="text-muted-foreground mb-6">
                Définissez votre premier périmètre agricole pour activer la surveillance
              </p>
              <Button
                onClick={startDrawing}
                className="bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer Mon Premier Périmètre
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {perimeters.map((perimeter) => (
                <div key={perimeter.id} className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />

                  <Card className="relative border-2 border-gray-100 hover:shadow-lg transition-all bg-white/90">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">{perimeter.name}</h3>
                          {perimeter.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{perimeter.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground font-medium">Surface</span>
                            <span className="font-bold text-green-900">
                              {perimeter.area_hectares ? `${perimeter.area_hectares} ha` : 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground font-medium">Points GPS</span>
                            <span className="font-bold text-blue-900">
                              {perimeter.coordinates?.length || 0} points
                            </span>
                          </div>
                        </div>

                        {perimeter.center_lat && perimeter.center_lng && (
                          <div className="p-3 rounded-xl bg-gradient-to-r from-orange-50 to-red-50">
                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <Navigation className="w-3 h-3" />
                              Centre GPS
                            </p>
                            <p className="text-xs font-mono font-bold text-gray-900">
                              {parseFloat(perimeter.center_lat).toFixed(6)}, {parseFloat(perimeter.center_lng).toFixed(6)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(perimeter)}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-2"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Modifier
                        </Button>
                        <Button
                          onClick={() => handleDelete(perimeter.id)}
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          disabled={deletePerimeterMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zone de Dessin */}
      {isDrawing && (
        <Card className="bg-white/80 backdrop-blur-xl border-2 border-blue-500 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Navigation className="w-6 h-6" />
              {editingPerimeter ? "Modifier le Périmètre" : "Dessiner Nouveau Périmètre"}
            </CardTitle>
            <CardDescription>
              Cliquez sur la carte pour placer des points GPS. Minimum 3 points requis.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Instructions */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <h4 className="font-bold text-sm text-blue-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Instructions
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Cliquez pour ajouter un point GPS</li>
                <li>• Minimum 3 points pour former un polygone</li>
                <li>• Les points seront connectés automatiquement</li>
                <li>• Utilisez "Retirer dernier" pour corriger</li>
                <li>• Cliquez "Terminer" quand votre périmètre est complet</li>
              </ul>
            </div>

            {/* Carte Interactive Simulée */}
            <div className="border-4 border-dashed border-blue-300 rounded-2xl bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 p-8">
              <div className="text-center mb-6">
                <Map className="w-16 h-16 mx-auto mb-3 text-blue-600" />
                <p className="text-lg font-bold text-gray-900 mb-2">Zone de Carte Interactive</p>
                <p className="text-sm text-muted-foreground">
                  Dans une implémentation réelle, intégrez ici Leaflet ou MapBox
                </p>
              </div>

              {/* Simulation: Formulaire GPS Manuel */}
              <div className="max-w-md mx-auto space-y-4">
                <div className="p-4 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-blue-200">
                  <h4 className="font-semibold text-sm mb-3">Ajouter Point GPS Manuellement</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <FloatingInput
                      id="temp_lat"
                      label="Latitude"
                      type="number"
                      step="0.000001"
                      placeholder="14.7167"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const lat = parseFloat(e.target.value)
                          const lng = parseFloat(document.getElementById('temp_lng').value)
                          if (!isNaN(lat) && !isNaN(lng)) {
                            addPoint(lat, lng)
                            e.target.value = ''
                            document.getElementById('temp_lng').value = ''
                          }
                        }
                      }}
                    />
                    <FloatingInput
                      id="temp_lng"
                      label="Longitude"
                      type="number"
                      step="0.000001"
                      placeholder="-17.4677"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Appuyez sur Entrée pour ajouter le point
                  </p>
                </div>

                {/* Points Actuels */}
                {currentPoints.length > 0 && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                    <h4 className="font-semibold text-sm mb-3 text-green-900">
                      Points Définis ({currentPoints.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {currentPoints.map((point, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-white/60">
                          <span className="text-xs font-mono font-bold text-gray-900">
                            Point {index + 1}: {point[0].toFixed(6)}, {point[1].toFixed(6)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {currentPoints.length >= 3 && (
                      <div className="mt-3 p-3 rounded-lg bg-green-100 border border-green-300">
                        <p className="text-xs font-semibold text-green-900">
                          Surface estimée: {calculateArea(currentPoints)} hectares
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={removeLastPoint}
                variant="outline"
                className="border-2"
                disabled={currentPoints.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Retirer Dernier Point
              </Button>

              <Button
                onClick={finishDrawing}
                className="flex-1 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 shadow-lg"
                disabled={currentPoints.length < 3}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Terminer Dessin ({currentPoints.length} points)
              </Button>

              <Button
                onClick={cancelDrawing}
                variant="destructive"
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire Nom/Description */}
      {showForm && (
        <Card className="bg-white/95 backdrop-blur-xl border-2 border-green-500 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Save className="w-6 h-6" />
              Enregistrer le Périmètre
            </CardTitle>
            <CardDescription>Donnez un nom et une description à votre zone</CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <FloatingInput
              id="perimeter_name"
              label="Nom du Périmètre"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Ex: Champ Nord, Parcelle A..."
            />

            <div>
              <label className="text-sm font-medium mb-2 block">Description (optionnel)</label>
              <textarea
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none transition-all"
                rows={3}
                placeholder="Détails supplémentaires sur cette zone..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <h4 className="font-semibold text-sm mb-3">Résumé</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Points GPS:</span>
                  <span className="font-bold">{currentPoints.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Surface estimée:</span>
                  <span className="font-bold">{calculateArea(currentPoints)} ha</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t-2">
              <Button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 shadow-lg"
                disabled={createPerimeterMutation.isPending || updatePerimeterMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {createPerimeterMutation.isPending || updatePerimeterMutation.isPending
                  ? "Enregistrement..."
                  : "Enregistrer"}
              </Button>
              <Button
                onClick={cancelDrawing}
                variant="outline"
                className="border-2"
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(243, 244, 246, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #6366f1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}
