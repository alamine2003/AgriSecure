import { useState } from "react"
import { useNavigate } from "react-router-dom"
import client from "../api/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  Map, MapPin, Trash2, Edit, Navigation, Home, Plus, Square
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { FloatingInput } from "@/components/ui/floating-input"
import { FieldMapDrawer } from "@/components/ui/field-map-drawer"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"

export default function PerimeterDefinitionAdvanced() {
  const navigate = useNavigate()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingPerimeter, setEditingPerimeter] = useState(null)
  const [perimeterData, setPerimeterData] = useState(null)
  const [formData, setFormData] = useState({ name: "", description: "" })

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
    createPerimeterMutation.mutate({ ...perimeterData, name: formData.name, description: formData.description })
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
    updatePerimeterMutation.mutate({ id: editingPerimeter.id, data: { ...perimeterData, name: formData.name, description: formData.description } })
  }

  const startEdit = (perimeter) => {
    setEditingPerimeter(perimeter)
    setFormData({ name: perimeter.name, description: perimeter.description || "" })
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
  const totalArea = perimeters.reduce((sum, p) => sum + (p.area_hectares || 0), 0)
  const totalPoints = perimeters.reduce((sum, p) => sum + (p.coordinates?.length || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.07] via-card to-orange-500/[0.04]" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/[0.06] rounded-full blur-[80px]" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full text-xs font-medium text-amber-400 mb-3">
              <Map className="w-3.5 h-3.5" />
              Cartographie GPS
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Gestion des Périmètres</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Dessinez et gérez vos parcelles agricoles avec précision
            </p>
          </div>
          <Button
            onClick={() => navigate('/agent/dashboard')}
            variant="outline"
            className="rounded-xl border-border/50 hover:border-primary/30"
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Périmètres", value: perimeters.length, icon: MapPin, gradient: "from-sky-500 to-blue-600", shadow: "shadow-sky-500/20" },
          { label: "Surface totale", value: `${totalArea.toFixed(2)} ha`, icon: Square, gradient: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/20" },
          { label: "Points GPS", value: totalPoints, icon: Navigation, gradient: "from-violet-500 to-purple-600", shadow: "shadow-violet-500/20" },
        ].map(({ label, value, icon: Icon, gradient, shadow }) => (
          <div key={label} className="bg-card rounded-2xl border border-border/50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
              </div>
              <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg", gradient, shadow)}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit form with map */}
      {(showCreateForm || editingPerimeter) ? (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="border-b border-border/50 px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              {editingPerimeter ? <Edit className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {editingPerimeter ? `Modifier: ${editingPerimeter.name}` : 'Nouveau Périmètre'}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {editingPerimeter ? 'Glissez les points pour modifier' : 'Cliquez sur la carte pour dessiner'}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <FieldMapDrawer
              onSave={handleMapSave}
              initialPolygon={editingPerimeter?.coordinates || []}
              initialCenter={
                editingPerimeter
                  ? { lat: editingPerimeter.center_lat, lng: editingPerimeter.center_lng }
                  : { lat: 14.4974, lng: -14.4524 }
              }
              initialZoom={editingPerimeter ? 14 : 8}
              height="500px"
              editMode={!!editingPerimeter}
            />

            {perimeterData && (
              <div className="space-y-4 p-5 bg-primary/5 border border-primary/20 rounded-xl">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Informations du périmètre
                </h4>

                <FloatingInput
                  id="name"
                  label="Nom du périmètre *"
                  value={formData.name}
                  onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                  required
                />

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Description (optionnel)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    placeholder="Informations supplémentaires..."
                  />
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Points", value: perimeterData.coordinates.length },
                    { label: "Surface", value: `${perimeterData.area_hectares} ha` },
                    { label: "Latitude", value: perimeterData.center.lat.toFixed(5) },
                    { label: "Longitude", value: perimeterData.center.lng.toFixed(5) },
                  ].map((s) => (
                    <div key={s.label} className="p-3 bg-card border border-border/50 rounded-xl">
                      <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
                      <p className="text-sm font-bold text-foreground font-mono">{s.value}</p>
                    </div>
                  ))}
                </div>

                {perimeterData.nearest_commune && (
                  <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl">
                    <p className="text-[11px] text-sky-400 font-medium mb-1">Localisation</p>
                    <p className="text-sm font-semibold text-foreground">
                      {perimeterData.nearest_commune.name}, {perimeterData.nearest_commune.region}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-border/50">
                  <Button
                    onClick={editingPerimeter ? handleUpdateSubmit : handleCreateSubmit}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl shadow-lg shadow-amber-500/20 border-0"
                    disabled={createPerimeterMutation.isPending || updatePerimeterMutation.isPending}
                  >
                    {editingPerimeter ? 'Mettre à jour' : 'Enregistrer'}
                  </Button>
                  <Button
                    onClick={cancelEdit}
                    variant="outline"
                    className="flex-1 rounded-xl border-border/50"
                    disabled={createPerimeterMutation.isPending || updatePerimeterMutation.isPending}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Perimeters list */
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Map className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Mes Périmètres</h3>
                <p className="text-[11px] text-muted-foreground">{perimeters.length} périmètre(s) défini(s)</p>
              </div>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl shadow-lg shadow-amber-500/20 border-0"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Nouveau
            </Button>
          </div>

          <div className="p-5">
            {perimetersQuery.isLoading ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3 animate-pulse">
                  <Map className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            ) : perimeters.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                  <MapPin className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Aucun périmètre</p>
                <p className="text-xs text-muted-foreground mb-4">Commencez par dessiner votre premier périmètre</p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl shadow-lg shadow-amber-500/20 border-0"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Créer un Périmètre
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {perimeters.map((perimeter) => (
                  <div key={perimeter.id} className="group rounded-2xl border border-border/50 p-5 hover:border-primary/20 transition-all bg-card">
                    <div className="mb-3">
                      <h3 className="font-semibold text-foreground mb-1">{perimeter.name}</h3>
                      {perimeter.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{perimeter.description}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <p className="text-[10px] text-amber-400 font-medium">Surface</p>
                        <p className="text-sm font-bold text-foreground">{perimeter.area_hectares} ha</p>
                      </div>
                      <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl">
                        <p className="text-[10px] text-sky-400 font-medium">Points</p>
                        <p className="text-sm font-bold text-foreground">{perimeter.coordinates?.length || 0}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => startEdit(perimeter)}
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-xl border-border/50 hover:border-primary/30 hover:bg-primary/5"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1.5" />
                        Modifier
                      </Button>
                      <Button
                        onClick={() => handleDelete(perimeter)}
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-border/50 hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                        disabled={deletePerimeterMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
