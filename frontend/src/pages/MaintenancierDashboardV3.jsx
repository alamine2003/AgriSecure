import React from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import {
  Users, UserPlus, UserCheck, UserX, Calendar, Camera,
  AlertTriangle, TrendingUp, Activity, Clock, CheckCircle,
  XCircle, Eye, Shield, Zap, Target, Sparkles, ArrowUpRight,
  BarChart3, PieChart
} from 'lucide-react';
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
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-500 font-medium">Chargement du dashboard...</p>
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
      color: "bg-blue-500",
      lightBg: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Demandes en Attente",
      value: kpi?.requests?.pending || 0,
      total: kpi?.requests?.total || 0,
      icon: UserPlus,
      color: "bg-amber-500",
      lightBg: "bg-amber-50",
      textColor: "text-amber-600",
    },
    {
      title: "Caméras Actives",
      value: kpi?.cameras?.active || 0,
      total: kpi?.cameras?.total || 0,
      icon: Camera,
      color: "bg-emerald-500",
      lightBg: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      title: "Alertes Critiques",
      value: kpi?.alerts?.critical || 0,
      total: kpi?.alerts?.total || 0,
      icon: AlertTriangle,
      color: "bg-rose-500",
      lightBg: "bg-rose-50",
      textColor: "text-rose-600",
    }
  ];

  const secondaryKPIs = [
    {
      label: "RDV Planifiés",
      value: kpi?.appointments?.pending || 0,
      icon: Calendar,
      color: "bg-purple-500",
      lightBg: "bg-purple-50",
    },
    {
      label: "Approuvées",
      value: kpi?.requests?.approved || 0,
      icon: CheckCircle,
      color: "bg-green-500",
      lightBg: "bg-green-50",
    },
    {
      label: "Rejetées",
      value: kpi?.requests?.rejected || 0,
      icon: XCircle,
      color: "bg-red-500",
      lightBg: "bg-red-50",
    },
    {
      label: "Détections / 7j",
      value: kpi?.detections?.weekly || 0,
      icon: Eye,
      color: "bg-indigo-500",
      lightBg: "bg-indigo-50",
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
    if (action.includes('CREATE') || action.includes('APPROVE')) return 'bg-green-500';
    if (action.includes('DELETE') || action.includes('REJECT')) return 'bg-red-500';
    if (action.includes('UPDATE')) return 'bg-blue-500';
    return 'bg-gray-500';
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

  // Circular progress for quick stats
  const CircularProgress = ({ value, size = 100, strokeWidth = 8, color = "#6366f1" }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className="absolute text-lg font-bold text-gray-900">{value}%</span>
      </div>
    );
  };

  const approvalRate = kpi?.requests?.total > 0 ? Math.round((kpi.requests.approved / kpi.requests.total) * 100) : 0;
  const agentRate = kpi?.agents?.total > 0 ? Math.round((kpi.agents.active / kpi.agents.total) * 100) : 0;
  const cameraRate = kpi?.cameras?.total > 0 ? Math.round((kpi.cameras.active / kpi.cameras.total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Main KPI Cards - Pill-style like the reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {mainKPIs.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", item.lightBg)}>
                  <Icon className={cn("w-6 h-6", item.textColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 truncate">{item.title}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-gray-900">{item.value}</span>
                    {item.total > 0 && (
                      <span className="text-sm text-gray-400">/ {item.total}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary KPIs - smaller */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {secondaryKPIs.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", item.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-xl font-bold text-gray-900">{item.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Grid - Circular Stats + Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Circular Progress Stats */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
          </div>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <CircularProgress value={approvalRate} color="#10b981" />
              <p className="text-xs text-gray-500 mt-2 font-medium">Approbation</p>
            </div>
            <div className="text-center">
              <CircularProgress value={agentRate} color="#6366f1" />
              <p className="text-xs text-gray-500 mt-2 font-medium">Agents actifs</p>
            </div>
            <div className="text-center">
              <CircularProgress value={cameraRate} color="#f59e0b" />
              <p className="text-xs text-gray-500 mt-2 font-medium">Caméras</p>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Historique</h3>
            </div>
            <Badge variant="secondary" className="text-xs">
              {activities?.length || 0}
            </Badge>
          </div>

          <div className="p-4 max-h-[320px] overflow-y-auto space-y-1">
            {activities && activities.length > 0 ? (
              activities.map((log, index) => {
                const Icon = getActionIcon(log.action);
                return (
                  <div
                    key={log.id || index}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0",
                      getActionColor(log.action)
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {log.action_display}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{log.user_name}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatTimeAgo(log.created_at)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10">
                <Shield className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-sm text-gray-400">Aucune activité récente</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions + Members-style */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Actions Rapides</h3>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { icon: UserPlus, label: "Créer un agent", desc: "Ajouter un nouvel agent", color: "bg-green-500" },
              { icon: Calendar, label: "Planifier RDV", desc: "Prendre un rendez-vous", color: "bg-blue-500" },
              { icon: Eye, label: "Voir rapports", desc: "Consulter les rapports", color: "bg-purple-500" },
              { icon: Camera, label: "Gérer caméras", desc: "Configuration réseau", color: "bg-amber-500" }
            ].map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 text-left group"
                >
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", action.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{action.label}</p>
                    <p className="text-xs text-gray-500">{action.desc}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
