import { useQuery } from "@tanstack/react-query";
import { Navigate, useLocation, Link } from "react-router-dom";
import client from '../api/client';
import {
  Camera, Bell, AlertTriangle, TrendingUp, Activity,
  Shield, Clock, Users, Calendar, ArrowUpRight, Eye
} from 'lucide-react';
import { cn } from "@/lib/utils";

export default function Dashboard({ role }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const location = useLocation();
  const actualRole = user.role;

  const camerasQuery = useQuery({
    queryKey: ["cameras"],
    queryFn: async () => {
      const res = await client.get("/surveillance/cameras/");
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  const detectionsQuery = useQuery({
    queryKey: ["detections", "recent"],
    queryFn: async () => {
      const res = await client.get("/surveillance/detections/?limit=20");
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  const cameras = camerasQuery.data || [];
  const detections = detectionsQuery.data || [];
  const isMaintenancier = role === "maintenancier" || actualRole === "maintenancier";

  if (role === "maintenancier" && actualRole && actualRole !== "maintenancier") {
    return <Navigate to="/dashboard" replace />;
  }
  if (!role && actualRole === "maintenancier" && location.pathname === "/dashboard") {
    return <Navigate to="/maintenancier/dashboard" replace />;
  }
  if (!role && actualRole === "agent_agricole" && location.pathname === "/dashboard") {
    return <Navigate to="/agent/dashboard" replace />;
  }

  const highCount = detections.filter(d => d.danger_level === 'HIGH').length;
  const todayCount = detections.filter(d => {
    return new Date(d.detected_at).toDateString() === new Date().toDateString();
  }).length;

  const statCards = isMaintenancier ? [
    { title: "Agents", value: cameras.length, icon: Users, gradient: "from-violet-500 to-purple-600" },
    { title: "RDV planifiés", value: "2", icon: Calendar, gradient: "from-amber-500 to-orange-600" },
    { title: "Caméras actives", value: cameras.filter(c => c.status === 'online').length, icon: Camera, gradient: "from-amber-500 to-orange-600" },
    { title: "Système", value: "OK", icon: Activity, gradient: "from-sky-500 to-blue-600" },
  ] : [
    { title: "Détections (24h)", value: todayCount, icon: TrendingUp, gradient: "from-sky-500 to-blue-600" },
    { title: "Alertes critiques", value: highCount, icon: AlertTriangle, gradient: "from-rose-500 to-red-600" },
    { title: "Caméras actives", value: cameras.filter(c => c.status === 'online').length, icon: Camera, gradient: "from-amber-500 to-orange-600" },
    { title: "Surveillance", value: cameras.length > 0 ? "Active" : "—", icon: Shield, gradient: "from-violet-500 to-purple-600" },
  ];

  const formatTimeAgo = (dateString) => {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return "À l'instant";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}j`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-card to-card" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {isMaintenancier ? "Dashboard Maintenancier" : `Bonjour, ${user.first_name || 'Agent'}`}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {isMaintenancier ? "Supervision globale de la plateforme" : "Tableau de bord de surveillance en temps réel"}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full text-xs font-medium text-amber-500">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            En ligne
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.title} className="group bg-card rounded-2xl border border-border/50 p-5 hover:border-border transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform", stat.gradient)}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Cameras */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Camera className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Caméras</h3>
            </div>
            {!isMaintenancier && (
              <Link to="/surveillance" className="flex items-center gap-1 text-xs text-primary hover:underline">
                Tout voir <ArrowUpRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          <div className="p-5">
            {camerasQuery.isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <Camera className="w-6 h-6 text-primary" />
                </div>
              </div>
            ) : cameras.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cameras.slice(0, 4).map((cam) => (
                  <div key={cam.id} className="rounded-2xl border border-border/50 p-4 hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                        cam.status === 'online'
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20'
                          : 'bg-muted'
                      }`}>
                        <Camera className={`w-5 h-5 ${cam.status === 'online' ? 'text-white' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{cam.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-2 h-2 rounded-full ${cam.status === 'online' ? 'bg-amber-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                          <span className={`text-[11px] ${cam.status === 'online' ? 'text-amber-500' : 'text-muted-foreground'}`}>
                            {cam.status === 'online' ? 'En ligne' : 'Hors ligne'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{cam.location}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                  <Camera className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">Aucune caméra configurée</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent detections */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="border-b border-border/50 px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Activité récente</h3>
          </div>

          <div className="p-3 max-h-[400px] overflow-y-auto">
            {detectionsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Activity className="w-8 h-8 text-primary animate-pulse" />
              </div>
            ) : detections.length > 0 ? (
              <ul className="space-y-1">
                {detections.slice(0, 10).map((det) => (
                  <li key={det.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      det.danger_level === 'HIGH' ? 'bg-destructive/10 text-destructive' :
                      det.danger_level === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-amber-500/10 text-amber-500'
                    )}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {det.detection_type || det.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(det.detected_at)}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span>{det.camera_name}</span>
                      </div>
                    </div>
                    <span className={cn(
                      "inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0",
                      det.danger_level === 'HIGH' ? 'bg-destructive/10 text-destructive' :
                      det.danger_level === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-amber-500/10 text-amber-500'
                    )}>
                      {det.danger_level}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                  <Eye className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">Aucune détection</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
