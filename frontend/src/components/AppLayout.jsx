import { NavLink, Outlet, useLocation } from "react-router-dom"
import {
  BarChart3, CalendarClock, Camera, FileText, LogOut, Shield, Users,
  UserPlus, Search, Bell, Map, ChevronRight, Activity
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import logoSvg from "@/assets/logo.svg"

function SidebarItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )
      }
      end={to === "/"}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary" />
          )}
          <Icon className="h-[18px] w-[18px]" />
          <span className="flex-1">{label}</span>
          {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
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
}

export default function AppLayout() {
  const location = useLocation()
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

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-[260px] bg-card border-r border-border/50 px-5 py-6 flex flex-col z-50">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 px-1">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-amber-500/20">
              <img src={logoSvg} alt="AgriWatch" className="w-full h-full" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight leading-none">AgriWatch</h2>
              <p className="text-[11px] text-muted-foreground mt-1">Surveillance Agricole</p>
            </div>
          </div>

          <p className="px-3 text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-2 font-medium">Navigation</p>

          <nav className="space-y-1 flex-1">
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
              </>
            )}

            <div className="pt-4 mt-4 border-t border-border/50">
              <p className="px-3 text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-2 font-medium">Système</p>
              <SidebarItem to="/admin/" icon={Shield} label="Admin Django" />
            </div>
          </nav>

          {/* User card */}
          <div className="mt-4 rounded-2xl bg-muted/30 border border-border/50 p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-amber-500/20">
                {initial}
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
        <main className="ml-[260px] flex-1 min-h-screen">
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-8 py-4">
            <div className="flex items-center justify-between gap-6">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-foreground truncate">{pageTitle}</h2>
                <p className="text-xs text-muted-foreground truncate">{pageSubtitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="pl-10 pr-4 py-2 rounded-xl bg-muted/50 border border-border/50 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all placeholder:text-muted-foreground/60"
                  />
                </div>
                <button className="relative p-2.5 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors">
                  <Bell className="w-[18px] h-[18px] text-muted-foreground" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive ring-2 ring-background" />
                </button>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-amber-500/20">
                  {initial}
                </div>
              </div>
            </div>
          </header>

          <div className="p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
