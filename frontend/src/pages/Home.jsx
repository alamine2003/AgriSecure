import { Link } from 'react-router-dom';
import {
  Shield,
  Camera,
  Bell,
  Brain,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Leaf,
  MapPin,
  Clock,
  BarChart3
} from 'lucide-react';
import { Button } from '../components/ui/button';

export default function Home() {
  const features = [
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Surveillance en Temps Réel",
      description: "Visionnez vos exploitations agricoles 24h/24 avec un flux vidéo haute qualité et une latence minimale.",
      color: "text-blue-600 bg-blue-50"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Détection IA Intelligente",
      description: "Intelligence artificielle YOLOv8 pour identifier les intrusions (humains, animaux) avec un taux de précision supérieur à 85%.",
      color: "text-purple-600 bg-purple-50"
    },
    {
      icon: <Bell className="w-8 h-8" />,
      title: "Alertes Instantanées",
      description: "Notifications push en temps réel via WebSocket. Recevez des alertes critiques en moins de 200ms.",
      color: "text-red-600 bg-red-50"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Sécurité Maximale",
      description: "Authentification JWT, isolation des flux vidéo, chiffrement end-to-end. Vos données sont protégées.",
      color: "text-green-600 bg-green-50"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Cartographie Interactive",
      description: "Visualisez vos périmètres agricoles sur une carte précise avec délimitation des zones de surveillance.",
      color: "text-yellow-600 bg-yellow-50"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Rapports & Statistiques",
      description: "Historique complet des détections, analyses de tendances et génération de rapports PDF automatiques.",
      color: "text-indigo-600 bg-indigo-50"
    }
  ];

  const stats = [
    { value: "< 200ms", label: "Latence Moyenne", icon: <Clock className="w-6 h-6" /> },
    { value: "99.7%", label: "Disponibilité", icon: <TrendingUp className="w-6 h-6" /> },
    { value: "85%+", label: "Précision IA", icon: <Brain className="w-6 h-6" /> },
    { value: "24/7", label: "Surveillance", icon: <Camera className="w-6 h-6" /> }
  ];

  const roles = [
    {
      title: "Agent Agricole",
      description: "Surveillez votre exploitation en temps réel, recevez des alertes instantanées et consultez l'historique des détections.",
      features: [
        "Accès exclusif à vos flux vidéo",
        "Alertes temps réel personnalisées",
        "Historique complet des détections",
        "Rapports PDF détaillés",
        "Cartographie de vos périmètres"
      ],
      link: "/login",
      buttonText: "Connexion Agent",
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "Maintenancier",
      description: "Gérez les comptes agents, coordonnez les installations techniques et assurez le support de la plateforme.",
      features: [
        "Gestion des comptes agents",
        "Coordination des rendez-vous",
        "Assignation des techniciens",
        "Support technique niveau 1",
        "Vue d'ensemble du réseau"
      ],
      link: "/login",
      buttonText: "Connexion Admin",
      color: "from-blue-500 to-indigo-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AgriWatch</h1>
              <p className="text-xs text-gray-600">Surveillance Agricole Intelligente</p>
            </div>
          </div>
          <Link to="/login">
            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              Se Connecter
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <CheckCircle className="w-4 h-4" />
            <span>Plateforme de Surveillance par IA</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Protégez Vos Exploitations
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
              Avec l'Intelligence Artificielle
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Système de surveillance agricole en temps réel utilisant YOLOv8 pour détecter les intrusions
            et protéger vos récoltes contre les menaces (animaux, intrus humains).
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register-agent">
              <Button size="lg" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg px-8">
                S'Inscrire Maintenant
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Se Connecter
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow">
              <div className="flex justify-center text-green-600 mb-3">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Fonctionnalités Avancées
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Une plateforme complète conçue avec les principes Clean Code et architecture SOLID
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 border border-gray-200 hover:border-green-300 hover:shadow-2xl transition-all duration-300"
              >
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choisissez Votre Profil
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Accès adapté selon votre rôle avec séparation stricte des responsabilités
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {roles.map((role, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300"
              >
                <div className={`h-3 rounded-t-3xl bg-gradient-to-r ${role.color} -mt-8 -mx-8 mb-6`} />

                <div className="flex items-center space-x-3 mb-4">
                  <Users className="w-8 h-8 text-gray-700" />
                  <h3 className="text-2xl font-bold text-gray-900">{role.title}</h3>
                </div>

                <p className="text-gray-600 mb-6">
                  {role.description}
                </p>

                <ul className="space-y-3 mb-8">
                  {role.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to={role.link}>
                  <Button className={`w-full bg-gradient-to-r ${role.color} hover:opacity-90 text-lg py-6`}>
                    {role.buttonText}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Prêt à Protéger Votre Exploitation ?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Rejoignez la plateforme de surveillance agricole nouvelle génération
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register-agent">
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-6">
                Demander un Compte
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                Se Connecter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">AgriWatch</span>
              </div>
              <p className="text-sm mb-4">
                Plateforme de surveillance agricole intelligente utilisant l'IA pour protéger vos exploitations 24h/24.
              </p>
              <p className="text-xs text-gray-500">
                © 2026 AgriWatch. Projet académique - Soutenance de fin d'études.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Liens Rapides</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-green-500 transition-colors">Fonctionnalités</a></li>
                <li><Link to="/login" className="hover:text-green-500 transition-colors">Connexion</Link></li>
                <li><a href="/api/docs/" className="hover:text-green-500 transition-colors">Documentation API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/admin/" className="hover:text-green-500 transition-colors">Administration</a></li>
                <li className="text-gray-500">Version 1.0</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-xs">
            <p>
              Construit avec React, Django, YOLOv8 et les principes Clean Code (SOLID, DRY, YAGNI)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
