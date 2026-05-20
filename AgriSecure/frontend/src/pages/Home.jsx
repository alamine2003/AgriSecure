import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Shield, Camera, Bell, Brain, Users, TrendingUp, CheckCircle,
  ArrowRight, Leaf, MapPin, Clock, BarChart3, Zap, Eye,
  ChevronRight, Star, Globe, Cpu, Lock, Wifi
} from 'lucide-react';
import { Button } from '../components/ui/button';
import logoSvg from '../assets/logo.svg';

function AnimatedCounter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <>{count}{suffix}</>;
}

export default function Home() {
  const features = [
    { icon: Camera, title: "Surveillance 24/7", description: "Flux vidéo HD en continu avec basculement automatique entre caméras et vision nocturne intégrée.", color: "from-amber-500 to-orange-600" },
    { icon: Brain, title: "Intelligence Artificielle", description: "Modèle YOLOv8 entraîné pour identifier humains, animaux et véhicules avec plus de 85% de précision.", color: "from-violet-500 to-purple-600" },
    { icon: Bell, title: "Alertes Instantanées", description: "Notifications push en moins de 200ms via WebSocket. Jamais une intrusion ne passe inaperçue.", color: "from-amber-500 to-orange-600" },
    { icon: MapPin, title: "Cartographie Précise", description: "Délimitez vos parcelles sur une carte interactive avec calcul automatique de la surface.", color: "from-sky-500 to-blue-600" },
    { icon: Shield, title: "Sécurité Renforcée", description: "Authentification JWT, chiffrement des flux et isolation complète entre exploitations.", color: "from-rose-500 to-red-600" },
    { icon: BarChart3, title: "Analytics & Rapports", description: "Tableaux de bord détaillés, historique des détections et exports PDF en un clic.", color: "from-amber-500 to-green-600" },
  ];

  const stats = [
    { value: 200, suffix: "ms", prefix: "<", label: "Latence moyenne" },
    { value: 99, suffix: ".7%", prefix: "", label: "Disponibilité" },
    { value: 85, suffix: "%+", prefix: "", label: "Précision IA" },
    { value: 24, suffix: "/7", prefix: "", label: "Monitoring" },
  ];

  const steps = [
    { num: "01", title: "Inscription", description: "Créez votre compte agent en quelques clics et attendez la validation." },
    { num: "02", title: "Installation", description: "Un technicien installe les caméras sur votre exploitation agricole." },
    { num: "03", title: "Surveillance", description: "L'IA surveille vos champs en continu et vous alerte en temps réel." },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white font-sans overflow-x-hidden">
      {/* ===== HEADER ===== */}
      <header className="fixed top-0 inset-x-0 z-50 transition-all">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] px-6 py-3">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-amber-500/25">
                <img src={logoSvg} alt="AgriWatch" className="w-full h-full" />
              </div>
              <span className="text-lg font-bold tracking-tight">AgriWatch</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm text-white/60">
              <a href="#features" className="hover:text-white transition-colors duration-200">Fonctionnalités</a>
              <a href="#how" className="hover:text-white transition-colors duration-200">Comment ça marche</a>
              <a href="#roles" className="hover:text-white transition-colors duration-200">Profils</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl">
                  Connexion
                </Button>
              </Link>
              <Link to="/register-agent">
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl shadow-lg shadow-amber-500/25 border-0">
                  Commencer
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center pt-24">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-orange-500/8 rounded-full blur-[128px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-900/20 rounded-full blur-[200px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-grid opacity-[0.03]" />
        </div>

        <div className="relative container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: text */}
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full text-xs font-medium text-amber-300 mb-8">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Propulsé par YOLOv8 — IA de dernière génération
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-[4.25rem] font-bold leading-[1.08] tracking-tight">
              Protégez vos
              <span className="block mt-2 bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400 bg-clip-text text-transparent">
                exploitations agricoles
              </span>
              <span className="block mt-2 text-white/90">intelligemment.</span>
            </h1>

            <p className="mt-8 text-lg text-white/50 max-w-xl leading-relaxed">
              AgriWatch combine vision par ordinateur, cartographie GPS et alertes instantanées
              pour détecter toute intrusion sur vos parcelles — 24 heures sur 24, 7 jours sur 7.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/register-agent">
                <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold rounded-2xl px-8 h-14 text-base shadow-2xl shadow-amber-500/30 border-0">
                  Demander un accès
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="rounded-2xl px-8 h-14 text-base border-white/10 text-white/80 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 backdrop-blur-sm">
                  <Eye className="w-5 h-5 mr-2" />
                  Voir la démo
                </Button>
              </Link>
            </div>

            {/* Demo credentials */}
            <div className="mt-10 flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-sm">
                <p className="text-white/40 text-xs uppercase tracking-wider font-medium">Accès démo instantané</p>
                <p className="text-white/70 mt-1">
                  <span className="text-white font-medium">agent@agriwatch.sn</span> / agent123
                  <span className="text-white/30 mx-2">|</span>
                  <span className="text-white font-medium">admin@agriwatch.sn</span> / admin123
                </p>
              </div>
            </div>
          </div>

          {/* Right: dashboard preview */}
          <div className="hidden lg:block animate-fade-up" style={{ animationDelay: '200ms' }}>
            <div className="relative">
              {/* Glow behind */}
              <div className="absolute -inset-8 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent rounded-[3rem] blur-3xl" />

              {/* Main card */}
              <div className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-sm font-medium text-white/80">Surveillance active</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Wifi className="w-3.5 h-3.5" />
                    4 caméras en ligne
                  </div>
                </div>

                {/* Fake camera view */}
                <div className="aspect-[16/9] rounded-2xl bg-gradient-to-br from-amber-950/80 to-slate-950 border border-white/[0.05] relative overflow-hidden mb-6">
                  <div className="absolute inset-0 bg-grid opacity-10" />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[11px] font-mono text-white/70">CAM-03 · Champ Nord</span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white/80">
                      <span className="text-amber-400 font-semibold">12.4 ha</span> · Thiès Centre
                    </div>
                    <div className="bg-amber-500/90 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg">
                      AUCUNE ALERTE
                    </div>
                  </div>
                  {/* Detection boxes */}
                  <div className="absolute top-1/3 left-1/4 w-16 h-20 border-2 border-amber-400/60 rounded-lg" />
                  <div className="absolute top-1/2 right-1/3 w-12 h-14 border-2 border-amber-400/60 rounded-lg" />
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Détections", value: "127", change: "+12%" },
                    { label: "Alertes", value: "0", change: "Stable" },
                    { label: "Uptime", value: "99.9%", change: "+0.2%" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 text-center">
                      <div className="text-xl font-bold text-white">{s.value}</div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">{s.label}</div>
                      <div className="text-[10px] text-amber-400 mt-1">{s.change}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating notification */}
              <div className="absolute -bottom-6 -left-6 bg-white/[0.08] backdrop-blur-2xl border border-white/[0.1] rounded-2xl p-4 shadow-xl animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/90">Aucune menace</p>
                    <p className="text-[10px] text-white/40">Dernière vérification: 2s</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <span className="text-xs">Découvrir</span>
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1.5">
            <div className="w-1 h-2 rounded-full bg-white/40 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="relative py-20 border-y border-white/[0.04]">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-950/30 via-transparent to-amber-950/30" />
        <div className="relative container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ value, suffix, prefix, label }) => (
              <div key={label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                  {prefix}<AnimatedCounter end={value} />{suffix}
                </div>
                <div className="text-sm text-white/40 mt-2">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-28">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full text-xs font-medium text-amber-300 mb-6">
              <Cpu className="w-3.5 h-3.5" />
              Technologies avancées
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Tout pour sécuriser
              <span className="block mt-2 bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                vos cultures
              </span>
            </h2>
            <p className="mt-6 text-white/40 text-lg">
              Une plateforme complète combinant IA, vidéo temps réel et cartographie
              pour une protection sans faille de vos exploitations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-3xl p-8 transition-all duration-500"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-white/40 leading-relaxed">{description}</p>
                <ChevronRight className="absolute top-8 right-8 w-5 h-5 text-white/10 group-hover:text-white/40 group-hover:translate-x-1 transition-all duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-950/20 to-transparent" />
        <div className="relative container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full text-xs font-medium text-amber-300 mb-6">
              <Globe className="w-3.5 h-3.5" />
              Simple et rapide
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Comment ça marche
            </h2>
            <p className="mt-6 text-white/40 text-lg">
              En trois étapes simples, sécurisez votre exploitation agricole.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
                )}
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 flex items-center justify-center mb-6">
                    <span className="text-3xl font-bold bg-gradient-to-b from-amber-300 to-amber-500 bg-clip-text text-transparent">{step.num}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-white/40 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ROLES ===== */}
      <section id="roles" className="py-28">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full text-xs font-medium text-amber-300 mb-6">
              <Users className="w-3.5 h-3.5" />
              Deux profils
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Une interface adaptée
              <span className="block mt-2 bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                à chaque rôle
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Agent card */}
            <div className="relative group bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-10 overflow-hidden hover:border-amber-500/30 transition-all duration-500">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all duration-500" />

              <div className="relative">
                <div className="w-14 h-14 rounded-2xl overflow-hidden mb-6 shadow-lg shadow-amber-500/20">
                  <img src={logoSvg} alt="AgriWatch" className="w-full h-full" />
                </div>
                <p className="text-xs uppercase tracking-widest text-amber-400 font-medium mb-2">Pour les exploitants</p>
                <h3 className="text-2xl font-bold mb-4">Agent Agricole</h3>
                <p className="text-white/40 mb-8 leading-relaxed">
                  Surveillez votre exploitation en temps réel, recevez des alertes ciblées et gardez le contrôle sur vos cultures où que vous soyez.
                </p>
                <ul className="space-y-3 mb-8">
                  {["Flux vidéo dédiés", "Alertes temps réel", "Périmètres sur carte", "Rapports détaillés", "Historique complet"].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login">
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl h-12 font-semibold shadow-lg shadow-amber-500/20 border-0">
                    Accéder à l'espace Agent
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Maintenancier card */}
            <div className="relative group bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-10 overflow-hidden hover:border-violet-500/30 transition-all duration-500">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-400 to-purple-500" />
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl group-hover:bg-violet-500/10 transition-all duration-500" />

              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <p className="text-xs uppercase tracking-widest text-violet-400 font-medium mb-2">Pour les équipes techniques</p>
                <h3 className="text-2xl font-bold mb-4">Maintenancier</h3>
                <p className="text-white/40 mb-8 leading-relaxed">
                  Pilotez le réseau de surveillance, gérez les comptes agents et supervisez la flotte de caméras sur tout le territoire.
                </p>
                <ul className="space-y-3 mb-8">
                  {["Gestion des agents", "Validation des inscriptions", "Planning d'installations", "Audit des actions", "Vue d'ensemble réseau"].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-violet-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login">
                  <Button className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white rounded-xl h-12 font-semibold shadow-lg shadow-violet-500/20 border-0">
                    Accéder à l'espace Admin
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TRUST / TECH ===== */}
      <section className="py-20 border-y border-white/[0.04]">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-white/30 text-sm">
            <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> JWT & HTTPS</span>
            <span className="flex items-center gap-2"><Brain className="w-4 h-4" /> YOLOv8</span>
            <span className="flex items-center gap-2"><Wifi className="w-4 h-4" /> WebSocket</span>
            <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> Leaflet Maps</span>
            <span className="flex items-center gap-2"><Cpu className="w-4 h-4" /> Django + React</span>
            <span className="flex items-center gap-2"><Camera className="w-4 h-4" /> Flux HD</span>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-28">
        <div className="container mx-auto px-6">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/[0.08]">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-[#0a1f18] to-orange-950" />
            <div className="absolute inset-0 bg-grid opacity-[0.04]" />
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px]" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px]" />

            <div className="relative px-10 py-20 md:px-20 md:py-24 text-center">
              <div className="w-20 h-20 mx-auto rounded-3xl overflow-hidden mb-8 shadow-2xl shadow-amber-500/30">
                <img src={logoSvg} alt="AgriWatch" className="w-full h-full" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl mx-auto">
                Prêt à protéger votre exploitation ?
              </h2>
              <p className="mt-6 text-white/40 text-lg max-w-xl mx-auto">
                Rejoignez les exploitants qui ont choisi une surveillance intelligente et automatisée pour leurs cultures.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link to="/register-agent">
                  <Button size="lg" className="bg-white text-amber-900 hover:bg-white/90 rounded-2xl h-14 px-8 text-base font-semibold shadow-2xl border-0">
                    Créer mon compte
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="rounded-2xl h-14 px-8 text-base border-white/20 text-white hover:bg-white/10 hover:border-white/30">
                    Se connecter
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/[0.04] py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl overflow-hidden">
                  <img src={logoSvg} alt="AgriWatch" className="w-full h-full" />
                </div>
                <span className="text-lg font-bold">AgriWatch</span>
              </div>
              <p className="text-white/30 text-sm max-w-sm leading-relaxed">
                Plateforme de surveillance agricole intelligente combinant IA, vidéo temps réel et cartographie pour protéger vos exploitations 24h/24.
              </p>
              <div className="flex items-center gap-4 mt-8">
                <div className="flex -space-x-2">
                  {['M', 'A', 'F'].map((l) => (
                    <div key={l} className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 border-2 border-[#0a0f0d] flex items-center justify-center text-xs font-bold">
                      {l}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-white/30">Utilisé par des exploitants au Sénégal</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-5 text-white/70">Produit</h4>
              <ul className="space-y-3 text-sm text-white/30">
                <li><a href="#features" className="hover:text-white/60 transition-colors">Fonctionnalités</a></li>
                <li><a href="#how" className="hover:text-white/60 transition-colors">Comment ça marche</a></li>
                <li><a href="#roles" className="hover:text-white/60 transition-colors">Profils</a></li>
                <li><Link to="/login" className="hover:text-white/60 transition-colors">Connexion</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-5 text-white/70">Technique</h4>
              <ul className="space-y-3 text-sm text-white/30">
                <li><a href="/api/docs/" className="hover:text-white/60 transition-colors">Documentation API</a></li>
                <li><a href="/admin/" className="hover:text-white/60 transition-colors">Administration</a></li>
                <li><span className="text-white/20">Version 1.0</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/20">© 2026 AgriWatch — Surveillance Agricole Intelligente</p>
            <div className="flex items-center gap-6 text-xs text-white/20">
              <span>Projet académique</span>
              <span>Sénégal</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
