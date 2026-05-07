import React from 'react';
import client from '../api/client';
import CameraFeed from '../components/CameraFeed';
import { useQuery } from "@tanstack/react-query";
import { Navigate, useLocation, Link } from "react-router-dom";
import {
  Camera,
  Bell,
  AlertTriangle,
  TrendingUp,
  Activity,
  Shield,
  Clock,
  ExternalLink,
  Users,
  MapPin,
  Calendar
} from 'lucide-react';

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";

const Dashboard = ({ role }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const location = useLocation();
  const actualRole = user.role;

  if (role === "maintenancier" && actualRole && actualRole !== "maintenancier") {
    return <Navigate to="/dashboard" replace />;
  }

  if (!role && actualRole === "maintenancier" && location.pathname === "/dashboard") {
    return <Navigate to="/maintenancier/agents" replace />;
  }

  const camerasQuery = useQuery({
    queryKey: ["cameras"],
    queryFn: async () => {
      const res = await client.get("/surveillance/cameras/");
      return res.data;
    },
  });

  const detectionsQuery = useQuery({
    queryKey: ["detections", "recent"],
    queryFn: async () => {
      const res = await client.get("/surveillance/detections/?limit=20");
      return res.data?.results || res.data;
    },
  });

  const statsQuery = useQuery({
    queryKey: ["stats", "dashboard"],
    queryFn: async () => {
      // Simuler des stats agrégées
      const detections = await client.get("/surveillance/detections/?limit=100");
      const data = detections.data?.results || detections.data || [];

      return {
        total: data.length,
        high: data.filter(d => d.danger_level === 'HIGH').length,
        medium: data.filter(d => d.danger_level === 'MEDIUM').length,
        low: data.filter(d => d.danger_level === 'LOW').length,
        today: data.filter(d => {
          const detectedDate = new Date(d.detected_at);
          const today = new Date();
          return detectedDate.toDateString() === today.toDateString();
        }).length
      };
    },
  });

  React.useEffect(() => {
    if (camerasQuery.error) notify.error("Erreur", "Impossible de charger les caméras.");
  }, [camerasQuery.error]);

  React.useEffect(() => {
    if (detectionsQuery.error) notify.error("Erreur", "Impossible de charger les détections.");
  }, [detectionsQuery.error]);

  const cameras = camerasQuery.data || [];
  const detections = detectionsQuery.data || [];
  const stats = statsQuery.data || { total: 0, high: 0, medium: 0, low: 0, today: 0 };
  const isMaintenancier = role === "maintenancier" || actualRole === "maintenancier";

  // Statistiques pour les cartes
  const statCards = isMaintenancier ? [
    {
      title: "Agents Actifs",
      value: cameras.length,
      icon: <Users className="w-5 h-5" />,
      description: "Comptes agents configurés",
      color: "text-blue-600 bg-blue-50",
      link: "/maintenancier/agents"
    },
    {
      title: "Rendez-vous",
      value: "En attente",
      icon: <Calendar className="w-5 h-5" />,
      description: "Installations planifiées",
      color: "text-purple-600 bg-purple-50",
      link: "/maintenancier/rendezvous"
    },
    {
      title: "Caméras Actives",
      value: cameras.filter(c => c.is_active).length,
      icon: <Camera className="w-5 h-5" />,
      description: "Flux vidéo en ligne",
      color: "text-green-600 bg-green-50"
    },
    {
      title: "Statut Système",
      value: "Opérationnel",
      icon: <Activity className="w-5 h-5" />,
      description: "Tous les services OK",
      color: "text-green-600 bg-green-50"
    }
  ] : [
    {
      title: "Détections Aujourd'hui",
      value: stats.today,
      icon: <TrendingUp className="w-5 h-5" />,
      description: "Depuis minuit",
      color: "text-blue-600 bg-blue-50"
    },
    {
      title: "Alertes Critiques",
      value: stats.high,
      icon: <AlertTriangle className="w-5 h-5" />,
      description: "Intrusions détectées",
      color: "text-red-600 bg-red-50"
    },
    {
      title: "Caméras Actives",
      value: cameras.filter(c => c.is_active).length,
      icon: <Camera className="w-5 h-5" />,
      description: "Surveillance en cours",
      color: "text-green-600 bg-green-50"
    },
    {
      title: "Statut Surveillance",
      value: cameras.length > 0 ? "Active" : "Inactive",
      icon: <Shield className="w-5 h-5" />,
      description: "Protection en temps réel",
      color: cameras.length > 0 ? "text-green-600 bg-green-50" : "text-gray-600 bg-gray-50"
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {isMaintenancier ? "Dashboard Maintenancier" : `Bienvenue, ${user.first_name || 'Agent'}`}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isMaintenancier
              ? "Gestion et supervision globale de la plateforme"
              : "Tableau de bord de surveillance en temps réel"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            <Activity className="w-3 h-3 mr-1 text-green-600" />
            En ligne
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-transparent hover:border-l-green-500"
            onClick={() => stat.link && window.location.href = stat.link}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Accès rapides Maintenancier */}
      {isMaintenancier && (
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-600" />
              <CardTitle>Accès Rapides Administration</CardTitle>
            </div>
            <CardDescription>Outils de gestion et supervision</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link to="/maintenancier/agents">
              <Button variant="outline" className="w-full justify-start hover:bg-white">
                <Users className="w-4 h-4 mr-2" />
                Gestion Agents
              </Button>
            </Link>
            <Link to="/maintenancier/rendezvous">
              <Button variant="outline" className="w-full justify-start hover:bg-white">
                <Calendar className="w-4 h-4 mr-2" />
                Rendez-vous
              </Button>
            </Link>
            <a href="/admin/" target="_blank" rel="noreferrer">
              <Button variant="outline" className="w-full justify-start hover:bg-white">
                <ExternalLink className="w-4 h-4 mr-2" />
                Django Admin
              </Button>
            </a>
          </CardContent>
        </Card>
      )}

      {/* Contenu principal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Caméras */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center">
              <Camera className="w-5 h-5 mr-2 text-green-600" />
              Flux de Surveillance
            </h2>
            {!isMaintenancier && (
              <Link to="/surveillance">
                <Button variant="ghost" size="sm">
                  Voir tout
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>

          {camerasQuery.isLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>Chargement des caméras...</CardTitle>
                <CardDescription>Veuillez patienter</CardDescription>
              </CardHeader>
            </Card>
          ) : cameras.length > 0 ? (
            cameras.slice(0, 2).map((cam) => (
              <Card key={cam.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="space-y-2 bg-gradient-to-r from-gray-50 to-green-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <Camera className="w-4 h-4 text-green-600" />
                        <CardTitle className="truncate text-lg">{cam.name}</CardTitle>
                      </div>
                      <CardDescription className="truncate flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {cam.location || 'Localisation non définie'}
                      </CardDescription>
                    </div>
                    <Badge variant={cam.is_active ? "default" : "secondary"} className="shrink-0">
                      {cam.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {!isMaintenancier ? (
                    <CameraFeed cameraId={cam.id} />
                  ) : (
                    <div className="bg-gray-100 rounded-lg p-8 text-center">
                      <Shield className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-sm text-gray-600">
                        Accès flux vidéo non autorisé pour le maintenancier
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Principe de séparation des responsabilités (RBAC)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardHeader className="text-center py-12">
                <Camera className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <CardTitle>Aucune caméra configurée</CardTitle>
                <CardDescription className="mt-2">
                  {isMaintenancier
                    ? "Les agents doivent d'abord installer leurs caméras"
                    : "Contactez le maintenancier pour configurer votre première caméra"}
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Activités récentes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center">
              <Bell className="w-5 h-5 mr-2 text-green-600" />
              Activité Récente
            </h2>
          </div>

          <Card className="h-fit max-h-[600px] overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50">
              <CardTitle className="text-base">Dernières Détections</CardTitle>
              <CardDescription>20 derniers événements</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                {detectionsQuery.isLoading ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Chargement...
                  </div>
                ) : detections.length > 0 ? (
                  <div className="divide-y">
                    {detections.map((det) => (
                      <div
                        key={det.id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="truncate text-sm font-medium">
                                {det.label.charAt(0).toUpperCase() + det.label.slice(1)} détecté
                              </div>
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(det.detected_at).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Confiance: {(det.confidence * 100).toFixed(0)}%
                            </div>
                          </div>
                          <Badge
                            variant={
                              det.danger_level === "HIGH"
                                ? "destructive"
                                : det.danger_level === "MEDIUM"
                                ? "secondary"
                                : "outline"
                            }
                            className="shrink-0"
                          >
                            {det.danger_level}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Aucune détection récente
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Résumé des alertes */}
          {!isMaintenancier && stats.total > 0 && (
            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
                  Résumé des Alertes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Niveau ÉLEVÉ:</span>
                    <span className="font-semibold text-red-600">{stats.high}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Niveau MOYEN:</span>
                    <span className="font-semibold text-orange-600">{stats.medium}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Niveau FAIBLE:</span>
                    <span className="font-semibold text-green-600">{stats.low}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
