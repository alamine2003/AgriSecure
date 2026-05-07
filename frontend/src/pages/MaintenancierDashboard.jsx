import React from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import {
  Users, UserPlus, UserCheck, UserX, Calendar, Camera,
  AlertTriangle, TrendingUp, Activity, Clock, CheckCircle,
  XCircle, Eye, Shield, Zap, Target, Sparkles, ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
