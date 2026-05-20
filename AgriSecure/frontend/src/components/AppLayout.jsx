import { useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import {
  BarChart3, CalendarClock, Camera, FileText, LogOut, Shield, Users,
  UserPlus, Search, Map, ChevronRight, Archive, Inbox, Settings, Menu, X
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import logoSvg from "@/assets/logo.svg"
import NotificationBell from "@/components/NotificationBell"

function SidebarItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 overflow-hidden",
          isActive
            ? "bg-[image:linear-gradient(120deg,hsl(var(--primary)/0.15),hsl(var(--accent)/0.10))] text-primary shadow-soft"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:translate-x-0.5"
        )
      }
      end={to === "/"}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-[image:var(--gradient-hero)] shadow-glow" />
          )}
          <Icon className={cn("h-[18px] w-[18px] transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
          <span className="flex-1">{label}</span>
          {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
        </>
      )}
    </NavLink>
  )
}

const SECTION_TITLES = {
  "/maintenancier/dashboard": ["Tableau de bord", "Vue d'ensemble du réseau"],
  "/maintenancier/inscription": ["Demandes d'inscription", "Validez les nouveaux agents"],
  "/maintenancier/agents": ["Gestion des agents", "Comptes & permissions"],
  "/maintenancier/rendezvous": ["Rendez-vous d'installation", "Planning technique"],
  "/agent/dashboard": ["Mon exploitation", "Périmètres, caméras et alertes"],
  "/agent/perimeter": ["Périmètres", "Définition cartographique"],
  "/surveillance": ["Surveillance Live", "Flux vidéo en direct"],
  "/reports": ["Rapports", "Historique et analyses"],
  "/agent/inbox": ["Boîte de réception", "Vos notifications"],
  "/agent/archive": ["Archives", "Historique des détections et alertes"],
  "/settings": ["Paramètres", "Profil et préférences"],
}

export default function AppLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const isMaintenancier = user.role === "maintenancier"
  const dashboardPath = isMaintenancier ? "/maintenancier/dashboard" : "/agent/dashboard"

  const roleLabel = isMaintenancier ? "Maintenancier" : "Agent agricole"
  const firstName = user.first_name || user.email?.split('@')[0] || "Utilisateur"
  const initial = firstName.charAt(0).toUpperCase()

  const [pageTitle, pageSubtitle] = SECTION_TITLES[location.pathname] || [
    `Bonjour, ${firstName}`,
    "Bienvenue sur votre espace AgriWatch",
  ]

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="h-screen overflow-hidden bg-mesh flex">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-[268px] bg-card/85 backdrop-blur-xl border-r border-border/60 px-5 py-6 flex flex-col z-50 transition-transform duration-300 ease-in-out shadow-soft",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo + close button mobile */}
        <div className="flex items-center gap-3 mb-8 px-1">
          <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-elev bg-[image:var(--gradient-hero)] p-[2px] flex-shrink-0">
            <div className="w-full h-full rounded-[14px] bg-card flex items-center justify-center overflow-hidden">
              <img src={logoSvg} alt="AgriWatch" className="w-7 h-7" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-extrabold tracking-tight leading-none text-gradient-brand">AgriWatch</h2>
            <p className="text-[11px] text-muted-foreground mt-1">Surveillance Agricole</p>
          </div>
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground"
            onClick={closeSidebar}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="px-3 text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-2 font-medium">Navigation</p>

        <nav className="space-y-1 flex-1 overflow-y-auto" onClick={closeSidebar}>
          <SidebarItem to={dashboardPath} icon={BarChart3} label="Dashboard" />
          {isMaintenancier ? (
            <>
              <SidebarItem to="/maintenancier/inscription" icon={UserPlus} label="Demandes" />
              <SidebarItem to="/maintenancier/agents" icon={Users} label="Agents" />
              <SidebarItem to="/maintenancier/rendezvous" icon={CalendarClock} label="Rendez-vous" />
            </>
          ) : (
            <>
              <SidebarItem to="/agent/perimeter" icon={Map} label="Périmètres" />
              <SidebarItem to="/surveillance" icon={Camera} label="Surveillance" />
              <SidebarItem to="/reports" icon={FileText} label="Rapports" />
              <SidebarItem to="/agent/inbox" icon={Inbox} label="Notifications" />
              <SidebarItem to="/agent/archive" icon={Archive} label="Archives" />
            </>
          )}

          <div className="pt-4 mt-4 border-t border-border/50">
            <p className="px-3 text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-2 font-medium">Système</p>
            <SidebarItem to="/settings" icon={Settings} label="Paramètres" />
            <SidebarItem to="/admin/" icon={Shield} label="Admin Django" />
          </div>
        </nav>

        {/* User card */}
        <div className="mt-4 rounded-2xl bg-[image:linear-gradient(135deg,hsl(var(--muted)/0.6),hsl(var(--secondary)/0.4))] border border-border/60 p-3 flex-shrink-0 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-[image:var(--gradient-hero)] text-white flex items-center justify-center font-bold text-sm shadow-elev flex-shrink-0">
              {initial}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card animate-pulse-ring" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{firstName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{roleLabel}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="mt-3 w-full justify-start gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg h-9 text-sm"
            onClick={() => {
              localStorage.removeItem("access_token")
              localStorage.removeItem("refresh_token")
              localStorage.removeItem("user")
              window.location.href = "/login"
            }}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-[268px] h-full flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="flex-shrink-0 z-30 glass border-b border-border/60 px-4 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Hamburger mobile */}
              <button
                className="lg:hidden p-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h2 className="text-base lg:text-lg font-bold text-foreground truncate">{pageTitle}</h2>
                <p className="text-xs text-muted-foreground truncate hidden sm:block">{pageSubtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="pl-10 pr-4 py-2 rounded-xl bg-background/70 border border-border/60 text-sm w-52 xl:w-72 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all placeholder:text-muted-foreground/60 shadow-soft"
                />
              </div>
              <NotificationBell />
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[image:var(--gradient-hero)] text-white flex items-center justify-center font-bold text-sm shadow-elev ring-2 ring-background">
                {initial}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 xl:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
