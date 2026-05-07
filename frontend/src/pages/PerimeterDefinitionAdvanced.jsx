import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import client from "../api/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  Map, MapPin, Trash2, Edit, Navigation, Sparkles, Home, Plus, Square
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FloatingInput } from "@/components/ui/floating-input"
import { FieldMapDrawer } from "@/components/ui/field-map-drawer"
import { notify } from "@/lib/notify"

export default function PerimeterDefinitionAdvanced() {
  const navigate = useNavigate()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingPerimeter, setEditingPerimeter] = useState(null)
  const [perimeterData, setPerimeterData] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const perimetersQuery = useQuery({
    queryKey: ["perimeters"],
    queryFn: async () => {
      const res = await client.get("/surveillance/perimeters/")
      return Array.isArray(res.data) ? res.data : res.data?.results || []
    },
    refetchInterval: 30000,
  })

  const createPerimeterMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        name: data.name,
        description: data.description || "",
        coordinates: data.coordinates,
        center_lat: data.center.lat,
        center_lng: data.center.lng,
        area_hectares: data.area_hectares
      }
      const res = await client.post("/surveillance/perimeters/", payload)
      return res.data
    },
    onSuccess: async () => {
      notify.success("Périmètre créé", "Votre périmètre agricole a été enregistré avec succès")
      setShowCreateForm(false)
      setPerimeterData(null)
      setFormData({ name: "", description: "" })
      await perimetersQuery.refetch()
    },
    onError: (err) => {
      console.error("Erreur création périmètre:", err.response?.data)
      notify.error("Erreur", err?.response?.data?.detail || "Impossible de créer le périmètre")
    },
  })

  const updatePerimeterMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const payload = {
        name: data.name,
        description: data.description || "",
        coordinates: data.coordinates,
        center_lat: data.center.lat,
        center_lng: data.center.lng,
        area_hectares: data.area_hectares
      }
      const res = await client.patch(`/surveillance/perimeters/${id}/`, payload)
      return res.data
    },
    onSuccess: async () => {
      notify.success("Périmètre mis à jour", "Les modifications ont été enregistrées")
      setEditingPerimeter(null)
      setPerimeterData(null)
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
      notify.success("Périmètre supprimé", "Le périmètre a été supprimé avec succès")
      await perimetersQuery.refetch()
    },
    onError: () => {
      notify.error("Erreur", "Impossible de supprimer le périmètre")
    },
  })

  const handleMapSave = (data) => {
    setPerimeterData(data)
    // Si on est en création, afficher le formulaire
    if (!editingPerimeter) {
      setShowCreateForm(true)
    }
  }

  const handleCreateSubmit = () => {
    if (!formData.name.trim()) {
      notify.error("Erreur", "Le nom du périmètre est requis")
      return
    }

    if (!perimeterData) {
      notify.error("Erreur", "Veuillez dessiner un périmètre sur la carte")
      return
    }

    createPerimeterMutation.mutate({
      ...perimeterData,
      name: formData.name,
      description: formData.description
    })
  }

  const handleUpdateSubmit = () => {
    if (!formData.name.trim()) {
      notify.error("Erreur", "Le nom du périmètre est requis")
      return
    }

    if (!perimeterData) {
      notify.error("Erreur", "Veuillez modifier le périmètre sur la carte")
      return
    }

    updatePerimeterMutation.mutate({
      id: editingPerimeter.id,
      data: {
        ...perimeterData,
        name: formData.name,
        description: formData.description
      }
    })
  }

  const startEdit = (perimeter) => {
    setEditingPerimeter(perimeter)
    setFormData({
      name: perimeter.name,
      description: perimeter.description || ""
    })
    setShowCreateForm(false)
  }

  const cancelEdit = () => {
    setEditingPerimeter(null)
    setPerimeterData(null)
    setShowCreateForm(false)
    setFormData({ name: "", description: "" })
  }

  const handleDelete = (perimeter) => {
    if (window.confirm(`Supprimer le périmètre "${perimeter.name}"?`)) {
      deletePerimeterMutation.mutate(perimeter.id)
    }
  }

  const perimeters = perimetersQuery.data || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 p-6 space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl">
                <Map className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-green-900 bg-clip-text text-transparent">
                Gestion des Périmètres Agricoles
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-500" />
                Dessinez et gérez vos parcelles avec précision GPS
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/agent/dashboard')}
            variant="outline"
            className="border-2"
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Périmètres Définis</p>
                <p className="text-4xl font-bold text-gray-900">{perimeters.length}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <MapPin className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Surface Totale</p>
                <p className="text-4xl font-bold text-gray-900">
                  {perimeters.reduce((sum, p) => sum + (p.area_hectares || 0), 0).toFixed(2)}
                  <span className="text-lg ml-1">ha</span>
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Square className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Points GPS Totaux</p>
                <p className="text-4xl font-bold text-gray-900">
                  {perimeters.reduce((sum, p) => sum + (p.coordinates?.length || 0), 0)}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                <Navigation className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carte de Dessin */}
      {(showCreateForm || editingPerimeter) ? (
        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl">
          <CardHeader className="border-b-2 border-gray-100">
            <CardTitle className="flex items-center gap-2">
              {editingPerimeter ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingPerimeter ? `Modifier: ${editingPerimeter.name}` : 'Nouveau Périmètre'}
            </CardTitle>
            <CardDescription>
              {editingPerimeter
                ? 'Modifiez les points du périmètre en les glissant sur la carte'
                : 'Dessinez votre périmètre en cliquant sur la carte'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* Carte */}
            <FieldMapDrawer
              onSave={handleMapSave}
              initialPolygon={editingPerimeter?.coordinates || []}
              initialCenter={
                editingPerimeter
                  ? { lat: editingPerimeter.center_lat, lng: editingPerimeter.center_lng }
                  : { lat: 14.4974, lng: -14.4524 }
              }
              initialZoom={editingPerimeter ? 14 : 8}
              height="600px"
              editMode={!!editingPerimeter}
            />

            {/* Formulaire */}
            {perimeterData && (
              <div className="space-y-4 p-4 bg-green-50 rounded-xl border-2 border-green-200">
                <h3 className="font-bold text-green-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Informations du Périmètre
                </h3>

                <FloatingInput
                  id="name"
                  label="Nom du périmètre *"
                  value={formData.name}
                  onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="Ex: Champ Principal Nord"
                />

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description (optionnel)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none resize-none"
                    placeholder="Informations supplémentaires sur le périmètre..."
                  />
                </div>

                {/* Résumé */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-xs text-gray-600">Points</p>
                    <p className="text-lg font-bold text-gray-900">{perimeterData.coordinates.length}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-xs text-gray-600">Surface</p>
                    <p className="text-lg font-bold text-gray-900">{perimeterData.area_hectares} ha</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-xs text-gray-600">Latitude</p>
                    <p className="text-xs font-mono font-bold text-gray-900">{perimeterData.center.lat.toFixed(5)}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-xs text-gray-600">Longitude</p>
                    <p className="text-xs font-mono font-bold text-gray-900">{perimeterData.center.lng.toFixed(5)}</p>
                  </div>
                </div>

                {perimeterData.nearest_commune && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700 mb-1">Localisation</p>
                    <p className="text-sm font-bold text-blue-900">
                      {perimeterData.nearest_commune.name}, {perimeterData.nearest_commune.region}
                    </p>
                    {perimeterData.nearest_commune.distance && (
                      <p className="text-xs text-blue-600 mt-1">~{perimeterData.nearest_commune.distance} km</p>
                    )}
                  </div>
                )}

                {/* Boutons */}
                <div className="flex gap-3 pt-4 border-t-2 border-green-200">
                  <Button
                    onClick={editingPerimeter ? handleUpdateSubmit : handleCreateSubmit}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
                    disabled={createPerimeterMutation.isPending || updatePerimeterMutation.isPending}
                  >
                    {editingPerimeter ? 'Mettre à Jour' : 'Enregistrer'}
                  </Button>
                  <Button
                    onClick={cancelEdit}
                    variant="outline"
                    className="flex-1 border-2"
                    disabled={createPerimeterMutation.isPending || updatePerimeterMutation.isPending}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Liste des Périmètres */
        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl">
          <CardHeader className="border-b-2 border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mes Périmètres</CardTitle>
                <CardDescription>{perimeters.length} périmètre(s) défini(s)</CardDescription>
              </div>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Périmètre
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {perimetersQuery.isLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : perimeters.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                <p className="text-xl font-bold text-gray-900 mb-2">Aucun périmètre</p>
                <p className="text-muted-foreground mb-4">
                  Commencez par dessiner votre premier périmètre agricole
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un Périmètre
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {perimeters.map((perimeter) => (
                  <Card key={perimeter.id} className="border-2 border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">{perimeter.name}</h3>
                          {perimeter.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{perimeter.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <p className="text-xs text-green-700">Surface</p>
                          <p className="text-sm font-bold text-green-900">{perimeter.area_hectares} ha</p>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <p className="text-xs text-blue-700">Points</p>
                          <p className="text-sm font-bold text-blue-900">{perimeter.coordinates?.length || 0}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => startEdit(perimeter)}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-2 hover:scale-105 transition-transform"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Modifier
                        </Button>
                        <Button
                          onClick={() => handleDelete(perimeter)}
                          variant="destructive"
                          size="sm"
                          className="hover:scale-105 transition-transform"
                          disabled={deletePerimeterMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
