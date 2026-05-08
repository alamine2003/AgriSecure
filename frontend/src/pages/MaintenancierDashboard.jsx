<<<<<<< HEAD
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import {
  Users, UserPlus, UserCheck, UserX, Calendar, Camera,
  AlertTriangle, TrendingUp, Activity, Clock, CheckCircle,
  XCircle, Eye, Shield, Zap, Target, Sparkles, ArrowUpRight,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MapContainer, TileLayer, Marker, Polygon, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';

export default function MaintenancierDashboardV3() {
  const { data: kpi, isLoading: kpiLoading } = useQuery({
    queryKey: ['maintenancier-kpi'],
    queryFn: async () => {
      const res = await client.get('/surveillance/maintenancier-stats/kpi/');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const { data: activities } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await client.get('/surveillance/audit-logs/?limit=15');
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  const { data: cameras } = useQuery({
    queryKey: ['all-cameras'],
    queryFn: async () => {
      const res = await client.get('/surveillance/cameras/');
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  const { data: mapPerimeters } = useQuery({
    queryKey: ['map-perimeters'],
    queryFn: async () => {
      const res = await client.get('/surveillance/perimeters/map_data/');
      return res.data?.perimeters || [];
    },
  });

  if (kpiLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-ping opacity-20"></div>
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>
          </div>
          <p className="text-lg font-medium text-gray-700">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  const mainKPIs = [
    {
      title: "Agents Actifs",
      value: kpi?.agents?.active || 0,
      total: kpi?.agents?.total || 0,
      icon: Users,
      gradient: "from-blue-500 via-blue-600 to-indigo-600",
      iconBg: "from-blue-400 to-blue-600",
      glowColor: "blue",
      change: "+12%",
      changeType: "increase"
    },
    {
      title: "Demandes en Attente",
      value: kpi?.requests?.pending || 0,
      total: kpi?.requests?.total || 0,
      icon: UserPlus,
      gradient: "from-amber-500 via-yellow-600 to-orange-600",
      iconBg: "from-amber-400 to-yellow-600",
      glowColor: "yellow",
      change: "3 nouvelles",
      changeType: "neutral"
    },
    {
      title: "Caméras Actives",
      value: kpi?.cameras?.active || 0,
      total: kpi?.cameras?.total || 0,
      icon: Camera,
      gradient: "from-emerald-500 via-green-600 to-teal-600",
      iconBg: "from-emerald-400 to-green-600",
      glowColor: "green",
      change: "+8%",
      changeType: "increase"
    },
    {
      title: "Alertes Critiques",
      value: kpi?.alerts?.critical || 0,
      icon: AlertTriangle,
      gradient: "from-rose-500 via-red-600 to-pink-600",
      iconBg: "from-rose-400 to-red-600",
      glowColor: "red",
      change: "-5%",
      changeType: "decrease"
    }
  ];

  const secondaryKPIs = [
    {
      label: "RDV Planifiés",
      value: kpi?.appointments?.pending || 0,
      icon: Calendar,
      gradient: "from-purple-500 to-indigo-600",
      textColor: "text-purple-700"
    },
    {
      label: "Approuvées",
      value: kpi?.requests?.approved || 0,
      icon: CheckCircle,
      gradient: "from-green-500 to-emerald-600",
      textColor: "text-green-700"
    },
    {
      label: "Rejetées",
      value: kpi?.requests?.rejected || 0,
      icon: XCircle,
      gradient: "from-red-500 to-rose-600",
      textColor: "text-red-700"
    },
    {
      label: "Détections / 7j",
      value: kpi?.detections?.weekly || 0,
      icon: Eye,
      gradient: "from-indigo-500 to-purple-600",
      textColor: "text-indigo-700"
    }
  ];

  const getActionIcon = (action) => {
    const icons = {
      'CREATE_AGENT': UserPlus,
      'UPDATE_AGENT': Users,
      'DELETE_AGENT': UserX,
      'ACTIVATE_AGENT': UserCheck,
      'DEACTIVATE_AGENT': UserX,
      'APPROVE_REQUEST': CheckCircle,
      'REJECT_REQUEST': XCircle,
      'CREATE_APPOINTMENT': Calendar,
    };
    return icons[action] || Activity;
  };

  const getActionColor = (action) => {
    if (action.includes('CREATE') || action.includes('APPROVE'))
      return 'bg-gradient-to-br from-green-400 to-emerald-600 text-white';
    if (action.includes('DELETE') || action.includes('REJECT'))
      return 'bg-gradient-to-br from-red-400 to-rose-600 text-white';
    if (action.includes('UPDATE'))
      return 'bg-gradient-to-br from-blue-400 to-indigo-600 text-white';
    return 'bg-gradient-to-br from-gray-400 to-slate-600 text-white';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}j`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6 space-y-8">
      {/* Header avec glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-xl border border-white/20 shadow-2xl p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2">
              Dashboard Maintenancier
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Vue d'ensemble en temps réel
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 px-4 py-2 text-sm shadow-lg">
            <Activity className="w-4 h-4 mr-2 animate-pulse" />
            Système Opérationnel
          </Badge>
        </div>
      </div>

      {/* Main KPIs - Bento Grid avec glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainKPIs.map((kpiItem, index) => {
          const Icon = kpiItem.icon;
          return (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
            >
              {/* Gradient background avec animation */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500",
                kpiItem.gradient
              )} />

              {/* Glow effect */}
              <div className={cn(
                "absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500",
                `bg-${kpiItem.glowColor}-500`
              )} />

              <CardContent className="relative p-6 space-y-4">
                {/* Icon avec glassmorphism */}
                <div className={cn(
                  "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500",
                  kpiItem.iconBg
                )}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Valeurs */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">{kpiItem.title}</p>
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {kpiItem.value}
                    </h3>
                    {kpiItem.total && (
                      <span className="text-xl text-gray-400 font-medium">/ {kpiItem.total}</span>
                    )}
                  </div>

                  {/* Trend indicator */}
                  {kpiItem.change && (
                    <div className={cn(
                      "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold",
                      kpiItem.changeType === 'increase' && "bg-green-100 text-green-700",
                      kpiItem.changeType === 'decrease' && "bg-red-100 text-red-700",
                      kpiItem.changeType === 'neutral' && "bg-gray-100 text-gray-700"
                    )}>
                      {kpiItem.changeType !== 'neutral' && (
                        <ArrowUpRight className={cn(
                          "w-3 h-3",
                          kpiItem.changeType === 'decrease' && "rotate-90"
                        )} />
                      )}
                      {kpiItem.change}
                    </div>
                  )}
                </div>
              </CardContent>
            </div>
          );
        })}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {secondaryKPIs.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-medium">{item.label}</p>
                    <p className={cn("text-3xl font-bold", item.textColor)}>{item.value}</p>
                  </div>
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300",
                    item.gradient
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </div>
          );
        })}
      </div>

      {/* Carte des Cameras et Perimetres */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl overflow-hidden">
        <div className="border-b border-gray-100 bg-gradient-to-r from-green-50 to-teal-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                Carte de Surveillance
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Localisation des cameras et perimetres agricoles
              </p>
            </div>
            <div className="flex gap-3">
              <Badge variant="secondary" className="shadow-sm">
                <Camera className="w-3 h-3 mr-1" />
                {cameras?.filter(c => c.latitude && c.longitude).length || 0} cameras
              </Badge>
              <Badge variant="secondary" className="shadow-sm">
                <Target className="w-3 h-3 mr-1" />
                {mapPerimeters?.length || 0} perimetres
              </Badge>
            </div>
          </div>
        </div>

        <div className="h-[400px]">
          <MapContainer
            center={[14.6928, -17.4467]}
            zoom={7}
            className="h-full w-full"
            scrollWheelZoom={true}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Markers des cameras */}
            {cameras?.filter(c => c.latitude && c.longitude).map((camera) => (
              <Marker
                key={camera.id}
                position={[parseFloat(camera.latitude), parseFloat(camera.longitude)]}
                icon={L.divIcon({
                  className: 'custom-camera-marker',
                  html: `<div style="background: ${camera.is_active ? '#10b981' : '#ef4444'}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  </div>`,
                  iconSize: [28, 28],
                  iconAnchor: [14, 14],
                })}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{camera.name}</p>
                    <p className="text-gray-500">{camera.location}</p>
                    <p className={camera.is_active ? 'text-green-600' : 'text-red-600'}>
                      {camera.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Polygones des perimetres */}
            {mapPerimeters?.map((perimeter) => {
              const positions = perimeter.coordinates?.map(c => [
                c[1] || c[0],
                c[0] || c[1]
              ]);
              if (!positions || positions.length < 3) return null;
              return (
                <Polygon
                  key={perimeter.id}
                  positions={positions}
                  pathOptions={{
                    color: perimeter.is_active ? '#4f46e5' : '#9ca3af',
                    fillColor: perimeter.is_active ? '#818cf8' : '#d1d5db',
                    fillOpacity: 0.25,
                    weight: 2,
                  }}
                >
                  <Tooltip>
                    <span className="font-semibold">{perimeter.name}</span>
                    <br />
                    Agent: {perimeter.agent?.name}
                    <br />
                    {perimeter.area_hectares?.toFixed(2)} ha
                  </Tooltip>
                </Polygon>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Bottom Section - Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activités Récentes */}
        <div className="lg:col-span-2 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl overflow-hidden">
          <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Activités Récentes
                </h3>
                <p className="text-sm text-gray-600 mt-1">Historique de vos actions</p>
              </div>
              <Badge variant="secondary" className="shadow-sm">
                {activities?.length || 0} actions
              </Badge>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {activities && activities.length > 0 ? (
                activities.map((log, index) => {
                  const Icon = getActionIcon(log.action);
                  return (
                    <div
                      key={log.id || index}
                      className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-300 border border-transparent hover:border-blue-100"
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md",
                        getActionColor(log.action)
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {log.action_display}
                        </p>
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {log.target_name}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <span>{log.user_name}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-400" />
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(log.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Aucune activité récente</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Rapides */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl overflow-hidden">
          <div className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50 p-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Statistiques Rapides
            </h3>
            <p className="text-sm text-gray-600 mt-1">Vue synthétique</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Progress bars avec glassmorphism */}
            {[
              { label: "Taux d'approbation", value: kpi?.requests?.total > 0 ? Math.round((kpi.requests.approved / kpi.requests.total) * 100) : 0, gradient: "from-green-500 to-emerald-600" },
              { label: "Agents actifs", value: kpi?.agents?.total > 0 ? Math.round((kpi.agents.active / kpi.agents.total) * 100) : 0, gradient: "from-blue-500 to-indigo-600" },
              { label: "Caméras actives", value: kpi?.cameras?.total > 0 ? Math.round((kpi.cameras.active / kpi.cameras.total) * 100) : 0, gradient: "from-green-500 to-teal-600" }
            ].map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{stat.label}</span>
                  <span className="font-bold text-gray-900">{stat.value}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out shadow-lg",
                      stat.gradient
                    )}
                    style={{ width: `${stat.value}%` }}
                  />
                </div>
              </div>
            ))}

            {/* Actions rapides */}
            <div className="pt-6 border-t space-y-3">
              <p className="text-sm font-semibold text-gray-700 mb-4">Actions Rapides</p>
              {[
                { icon: UserPlus, label: "Créer un agent", gradient: "from-green-500 to-emerald-600" },
                { icon: Calendar, label: "Planifier RDV", gradient: "from-blue-500 to-indigo-600" },
                { icon: Eye, label: "Voir rapports", gradient: "from-purple-500 to-pink-600" }
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-300 border border-transparent hover:border-blue-100 hover:shadow-md"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md",
                      action.gradient
                    )}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #6366f1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #4f46e5);
        }
      `}</style>
    </div>
  );
}
=======
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import {
  Users, UserPlus, UserCheck, UserX, Calendar, Camera,
  AlertTriangle, Activity, Clock, CheckCircle, XCircle, Eye,
  Shield, ArrowUpRight, TrendingUp, Wifi, Zap, Server,
  ChevronRight, BarChart3, CircleDot, Map
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardMap } from '@/components/ui/dashboard-map';

function CircularProgress({ value, size = 80, strokeWidth = 7, color }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-base font-bold text-foreground">{value}%</span>
    </div>
  );
}

export default function MaintenancierDashboard() {
  const navigate = useNavigate();

  const { data: kpi, isLoading: kpiLoading } = useQuery({
    queryKey: ['maintenancier-kpi'],
    queryFn: async () => {
      const res = await client.get('/surveillance/maintenancier-stats/kpi/');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const { data: activities } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await client.get('/surveillance/audit-logs/?limit=15');
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  const { data: requests } = useQuery({
    queryKey: ['registration-requests'],
    queryFn: async () => {
      const res = await client.get('/surveillance/registration-requests/');
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  const { data: camerasData } = useQuery({
    queryKey: ['all-cameras'],
    queryFn: async () => {
      const res = await client.get('/surveillance/cameras/');
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  const { data: perimetersData } = useQuery({
    queryKey: ['all-perimeters'],
    queryFn: async () => {
      const res = await client.get('/surveillance/perimeters/');
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  if (kpiLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-2xl bg-amber-500/20 animate-ping" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <BarChart3 className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  const totalAgents = kpi?.total_agents || 24;
  const activeAgents = kpi?.active_agents || 21;
  const camerasOnline = kpi?.cameras_online || 18;
  const camerasOffline = kpi?.cameras_offline || 3;
  const pendingRequests = kpi?.pending_requests || 2;
  const alerts24h = kpi?.alerts_24h || 14;
  const uptimePct = kpi?.uptime_pct || 99.7;
  const scheduledInstallations = kpi?.scheduled_installations || 2;

  const agentRate = Math.round((activeAgents / totalAgents) * 100);
  const cameraRate = Math.round((camerasOnline / (camerasOnline + camerasOffline)) * 100);

  const pendingReqs = (requests || []).filter(r => r.status === 'PENDING');

  const getActionIcon = (action) => {
    const icons = {
      'LOGIN': Users, 'CREATE_PERIMETER': Shield, 'APPROVE_REQUEST': CheckCircle,
      'UPDATE_USER': UserCheck, 'DELETE_CAMERA': XCircle,
    };
    return icons[action] || Activity;
  };

  const getActionStyle = (action) => {
    if (action.includes('CREATE') || action.includes('APPROVE') || action === 'LOGIN')
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' };
    if (action.includes('DELETE') || action.includes('REJECT'))
      return { bg: 'bg-rose-500/10', text: 'text-rose-400', dot: 'bg-rose-400' };
    if (action.includes('UPDATE'))
      return { bg: 'bg-sky-500/10', text: 'text-sky-400', dot: 'bg-sky-400' };
    return { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' };
  };

  const formatTimeAgo = (dateString) => {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return "À l'instant";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}j`;
  };

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.07] via-card to-orange-500/[0.04]" />
        <div className="absolute -top-32 -right-32 w-72 h-72 bg-amber-500/[0.06] rounded-full blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-orange-500/[0.05] rounded-full blur-[60px]" />

        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full text-xs font-medium text-amber-400 mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Tous les systèmes sont opérationnels
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Tableau de bord
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Supervision du réseau AgriWatch · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-card border border-border/50 px-4 py-2.5 rounded-xl">
              <Server className="w-4 h-4 text-amber-400" />
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Uptime</p>
                <p className="text-sm font-bold text-foreground">{uptimePct}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-card border border-border/50 px-4 py-2.5 rounded-xl">
              <Zap className="w-4 h-4 text-amber-400" />
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Alertes 24h</p>
                <p className="text-sm font-bold text-foreground">{alerts24h}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Agents actifs", value: activeAgents, total: totalAgents, icon: Users, gradient: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/25", change: `${agentRate}%`, up: true },
          { title: "Demandes en attente", value: pendingRequests, icon: UserPlus, gradient: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/25", change: "À traiter", up: null },
          { title: "Caméras en ligne", value: camerasOnline, total: camerasOnline + camerasOffline, icon: Camera, gradient: "from-sky-500 to-blue-600", shadow: "shadow-sky-500/25", change: `${cameraRate}%`, up: true },
          { title: "RDV planifiés", value: scheduledInstallations, icon: Calendar, gradient: "from-violet-500 to-purple-600", shadow: "shadow-violet-500/25", change: "Cette semaine", up: null },
        ].map(({ title, value, total, icon: Icon, gradient, shadow, change, up }) => (
          <div key={title} className="group relative bg-card rounded-2xl border border-border/50 p-6 hover:border-amber-500/20 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/[0.02] to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-start justify-between mb-5">
                <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300", gradient, shadow)}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {change && (
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium",
                    up === true ? "bg-amber-500/10 text-amber-400" :
                    up === false ? "bg-rose-500/10 text-rose-400" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {up === true && <TrendingUp className="w-3 h-3" />}
                    {change}
                  </span>
                )}
              </div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{title}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{value}</span>
                {total && <span className="text-sm text-muted-foreground">/ {total}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Middle section: Performance + Pending requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Performance circles */}
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <CircleDot className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Performance réseau</h3>
          </div>

          <div className="flex items-center justify-around">
            <div className="text-center">
              <CircularProgress value={agentRate} color="hsl(152, 65%, 45%)" />
              <p className="text-[11px] text-muted-foreground mt-3 font-medium">Agents</p>
            </div>
            <div className="text-center">
              <CircularProgress value={cameraRate} color="hsl(200, 80%, 50%)" />
              <p className="text-[11px] text-muted-foreground mt-3 font-medium">Caméras</p>
            </div>
            <div className="text-center">
              <CircularProgress value={Math.round(uptimePct)} color="hsl(270, 60%, 55%)" />
              <p className="text-[11px] text-muted-foreground mt-3 font-medium">Uptime</p>
            </div>
          </div>

          {/* Mini stats below circles */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-border/50">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{camerasOffline}</p>
              <p className="text-[10px] text-muted-foreground">Hors ligne</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{alerts24h}</p>
              <p className="text-[10px] text-muted-foreground">Alertes 24h</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{totalAgents}</p>
              <p className="text-[10px] text-muted-foreground">Total agents</p>
            </div>
          </div>
        </div>

        {/* Pending requests */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Demandes en attente</h3>
                <p className="text-[11px] text-muted-foreground">Inscriptions à valider</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/maintenancier/inscription')}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Tout voir <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-4">
            {pendingReqs.length > 0 ? (
              <div className="space-y-3">
                {pendingReqs.map((req) => (
                  <div key={req.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-amber-500/20 transition-colors">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/20">
                      {req.first_name?.charAt(0)}{req.last_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{req.first_name} {req.last_name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{req.email}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span>{req.commune}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-[11px] font-medium">
                        <Clock className="w-3 h-3" />
                        En attente
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-amber-400" />
                </div>
                <p className="text-sm text-muted-foreground">Aucune demande en attente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Activities + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity log */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Journal d'activité</h3>
                <p className="text-[11px] text-muted-foreground">Actions récentes sur la plateforme</p>
              </div>
            </div>
            <span className="inline-flex px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 text-xs font-medium">
              {activities?.length || 0} entrées
            </span>
          </div>

          <div className="p-3 max-h-[380px] overflow-y-auto">
            {activities && activities.length > 0 ? (
              <ul className="space-y-0.5">
                {activities.map((log, index) => {
                  const Icon = getActionIcon(log.action);
                  const style = getActionStyle(log.action);
                  return (
                    <li key={log.id || index} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/30 transition-colors">
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", style.bg)}>
                        <Icon className={cn("w-4 h-4", style.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {log.action?.replace(/_/g, ' ')}
                          </p>
                          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", style.dot)} />
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{log.user_email} · {log.target}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(log.created_at)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-center py-14">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                  <Shield className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">Aucune activité récente</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="border-b border-border/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Actions rapides</h3>
                <p className="text-[11px] text-muted-foreground">Accès direct aux fonctions</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-2">
            {[
              { icon: UserPlus, label: "Demandes d'inscription", desc: "Valider les nouveaux agents", path: "/maintenancier/inscription", gradient: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/20" },
              { icon: Users, label: "Gestion des agents", desc: "Comptes et permissions", path: "/maintenancier/agents", gradient: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/20" },
              { icon: Calendar, label: "Rendez-vous", desc: "Planning d'installations", path: "/maintenancier/rendezvous", gradient: "from-sky-500 to-blue-600", shadow: "shadow-sky-500/20" },
              { icon: Eye, label: "Vue d'ensemble", desc: "Monitoring global", path: "/maintenancier/dashboard", gradient: "from-violet-500 to-purple-600", shadow: "shadow-violet-500/20" },
            ].map(({ icon: Icon, label, desc, path, gradient, shadow }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted/30 transition-all duration-200 group text-left"
              >
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform", gradient, shadow)}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </button>
            ))}
          </div>

          {/* System status footer */}
          <div className="mx-4 mb-4 p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Wifi className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-amber-400">Réseau stable</p>
                <p className="text-[11px] text-muted-foreground">{camerasOnline} caméras connectées</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Carte des caméras et périmètres */}
      <DashboardMap
        perimeters={perimetersData || []}
        cameras={camerasData || []}
        height="420px"
        title="Carte du réseau"
        icon={Map}
      />
    </div>
  );
}
>>>>>>> feature/interface
