import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import client from "../api/client"
import { useQuery } from "@tanstack/react-query"
import {
  Camera, MapPin, AlertTriangle, Activity, TrendingUp, Eye,
  Zap, Shield, Clock, CheckCircle, XCircle, Sparkles,
  Navigation, Wifi, WifiOff, Map, Plus
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AgentDashboardV3() {
  const navigate = useNavigate()
  const [selectedCamera, setSelectedCamera] = useState(null)

  // Récupération des données
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
      return data.slice(0, 10) // 10 dernières
    },
    refetchInterval: 5000,
  })

  const alertsQuery = useQuery({
    queryKey: ["agent-alerts"],
    queryFn: async () => {
      const res = await client.get("/surveillance/alerts/?ordering=-created_at")
      const data = Array.isArray(res.data) ? res.data : res.data?.results || []
      return data.slice(0, 5) // 5 dernières
    },
    refetchInterval: 5000,
  })

  const cameras = camerasQuery.data || []
  const perimeters = perimetersQuery.data || []
  const detections = detectionsQuery.data || []
  const alerts = alertsQuery.data || []

  // Stats
  const activeCameras = cameras.filter(c => c.is_active).length
  const inactiveCameras = cameras.filter(c => !c.is_active).length
  const unreadAlerts = alerts.filter(a => !a.is_read).length
  const highDangerDetections = detections.filter(d => d.danger_level === 'HIGH').length

  const statsCards = [
    {
      label: "Caméras Actives",
      value: activeCameras,
      total: cameras.length,
      icon: Camera,
      gradient: "from-green-400 via-green-500 to-emerald-500",
      description: `${inactiveCameras} inactive(s)`
    },
    {
      label: "Périmètres",
      value: perimeters.length,
      total: perimeters.reduce((acc, p) => acc + (p.area_hectares || 0), 0).toFixed(1),
      icon: Map,
      gradient: "from-blue-400 via-blue-500 to-indigo-500",
      description: `${perimeters.reduce((acc, p) => acc + (p.area_hectares || 0), 0).toFixed(1)} ha surveillés`
    },
    {
      label: "Alertes Non Lues",
      value: unreadAlerts,
      total: alerts.length,
      icon: AlertTriangle,
      gradient: "from-red-400 via-red-500 to-rose-500",
      description: `${alerts.length} total`
    },
    {
      label: "Détections Haute",
      value: highDangerDetections,
      total: detections.length,
      icon: Shield,
      gradient: "from-orange-400 via-orange-500 to-red-500",
      description: `${detections.length} détections 24h`
    },
  ]

  const dangerConfig = {
    HIGH: { label: "Élevé", color: "from-red-500 to-rose-600", icon: AlertTriangle },
    MEDIUM: { label: "Moyen", color: "from-orange-500 to-amber-600", icon: Zap },
    LOW: { label: "Faible", color: "from-green-500 to-emerald-600", icon: CheckCircle },
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return "À l'instant"
    if (minutes < 60) return `Il y a ${minutes} min`
    if (hours < 24) return `Il y a ${hours}h`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 p-6 space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-green-900 bg-clip-text text-transparent">
                Surveillance Agricole
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-500" />
                Monitoring en temps réel de votre exploitation
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => navigate("/agent/perimeter")}
              className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 shadow-lg"
            >
              <Map className="w-4 h-4 mr-2" />
              Définir Périmètre
            </Button>
            <Button
              onClick={() => navigate("/surveillance")}
              className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 shadow-lg"
            >
              <Eye className="w-4 h-4 mr-2" />
              Surveillance Live
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="group relative">
              <div className={`absolute -inset-1 bg-gradient-to-r ${stat.gradient} rounded-3xl opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500`}></div>

              <Card className="relative bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2 font-medium">{stat.label}</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                          {stat.value}
                        </p>
                        {stat.total !== stat.value && (
                          <span className="text-sm text-muted-foreground">/ {stat.total}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
                    </div>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                      <Icon className="w-8 h-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Caméras */}
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl">
          <CardHeader className="border-b-2 border-dashed">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Camera className="w-6 h-6 text-green-600" />
                  Mes Caméras ({cameras.length})
                </CardTitle>
                <CardDescription>Équipements installés avec localisation GPS</CardDescription>
              </div>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 flex items-center gap-2">
                <Activity className="w-3 h-3 animate-pulse" />
                Live
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {camerasQuery.isLoading ? (
              <div className="text-center py-12">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 animate-ping opacity-20"></div>
                  <Camera className="relative w-16 h-16 text-green-600 animate-pulse" />
                </div>
                <p className="text-muted-foreground font-medium">Chargement des caméras...</p>
              </div>
            ) : cameras.length === 0 ? (
              <div className="text-center py-12">
                <Camera className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                <p className="text-xl font-bold text-gray-900 mb-2">Aucune caméra installée</p>
                <p className="text-muted-foreground mb-4">
                  Vos caméras apparaîtront ici après l'installation de l'équipement
                </p>
                <Badge variant="outline" className="text-sm">
                  En attente d'installation technique
                </Badge>
              </div>
            ) : (
              <div className="space-y-4">
                {cameras.map((camera) => (
                  <div key={camera.id} className="group relative">
                    <div className={`absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 ${
                      camera.is_active ? 'bg-green-500' : 'bg-gray-500'
                    }`} />

                    <Card className="relative border-2 border-gray-100 hover:shadow-lg transition-all duration-300 bg-white/90">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
                            camera.is_active
                              ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                              : 'bg-gradient-to-br from-gray-400 to-gray-500'
                          }`}>
                            {camera.is_active ? (
                              <Wifi className="w-7 h-7 text-white" />
                            ) : (
                              <WifiOff className="w-7 h-7 text-white" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-lg text-gray-900">{camera.name}</h3>
                              <Badge className={`${
                                camera.is_active
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                  : 'bg-gray-400'
                              } text-white border-0`}>
                                {camera.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              {camera.location && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="w-4 h-4 text-blue-600" />
                                  <span>{camera.location}</span>
                                </div>
                              )}

                              {camera.latitude && camera.longitude && (
                                <div className="flex items-center gap-2 text-xs font-mono bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 rounded-lg">
                                  <Navigation className="w-3 h-3 text-blue-600" />
                                  <span className="font-bold text-gray-900">
                                    {parseFloat(camera.latitude).toFixed(6)}, {parseFloat(camera.longitude).toFixed(6)}
                                  </span>
                                </div>
                              )}

                              {camera.installed_at && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>Installée le {new Date(camera.installed_at).toLocaleDateString('fr-FR')}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => navigate(`/surveillance?camera=${camera.id}`)}
                              size="sm"
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Voir
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertes Récentes */}
        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl">
          <CardHeader className="border-b-2 border-dashed">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Alertes Récentes
            </CardTitle>
            <CardDescription>{unreadAlerts} non lue(s)</CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {alertsQuery.isLoading ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto mb-3 animate-pulse text-red-600" />
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-900 mb-1">Aucune alerte</p>
                <p className="text-xs text-muted-foreground">Tout est calme pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                      alert.is_read
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        alert.is_read ? 'bg-gray-200' : 'bg-gradient-to-br from-red-500 to-rose-600'
                      }`}>
                        <AlertTriangle className={`w-4 h-4 ${alert.is_read ? 'text-gray-600' : 'text-white'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold mb-1 ${alert.is_read ? 'text-gray-700' : 'text-red-900'}`}>
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(alert.created_at)}</p>
                      </div>
                      {!alert.is_read && (
                        <Badge className="bg-red-500 text-white text-xs">Nouveau</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Détections Récentes */}
      <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl">
        <CardHeader className="border-b-2 border-dashed">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Détections Récentes (24h)
          </CardTitle>
          <CardDescription>{detections.length} détection(s) enregistrée(s)</CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {detectionsQuery.isLoading ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 mx-auto mb-4 animate-pulse text-blue-600" />
              <p className="text-muted-foreground font-medium">Chargement des détections...</p>
            </div>
          ) : detections.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="w-20 h-20 mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-bold text-gray-900 mb-2">Aucune détection</p>
              <p className="text-muted-foreground">Les détections apparaîtront ici en temps réel</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {detections.map((detection) => {
                const config = dangerConfig[detection.danger_level]
                const DangerIcon = config.icon

                return (
                  <div key={detection.id} className="group relative">
                    <div className={`absolute -inset-1 bg-gradient-to-r ${config.color} rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />

                    <Card className="relative border-2 border-gray-100 hover:shadow-lg transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <Badge className={`bg-gradient-to-r ${config.color} text-white border-0`}>
                            <DangerIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(detection.detected_at)}</span>
                        </div>

                        <h4 className="font-bold text-lg text-gray-900 mb-2">{detection.label}</h4>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Confiance:</span>
                            <span className="font-bold">{(detection.confidence * 100).toFixed(1)}%</span>
                          </div>
                          {detection.camera_name && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Camera className="w-3 h-3" />
                              <span className="text-xs">{detection.camera_name}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(243, 244, 246, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #10b981, #059669);
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}
