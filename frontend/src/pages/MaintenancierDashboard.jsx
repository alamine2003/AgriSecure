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
