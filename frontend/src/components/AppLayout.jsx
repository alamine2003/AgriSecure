import { NavLink, Outlet } from "react-router-dom"
import { BarChart3, CalendarClock, Camera, FileText, LogOut, Shield, Users, UserPlus, Search, Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

function SidebarItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-white text-indigo-700 shadow-lg shadow-indigo-100"
            : "text-indigo-100 hover:bg-white/10 hover:text-white"
        )
      }
      end={to === "/"}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  )
}

export default function AppLayout() {
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const isMaintenancier = user.role === "maintenancier"
  const dashboardPath = isMaintenancier ? "/maintenancier/dashboard" : "/agent/dashboard"

  const roleLabel = isMaintenancier ? "Admin" : "Agent"
  const firstName = user.first_name || user.email?.split('@')[0] || "Utilisateur"

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-[260px] bg-gradient-to-b from-indigo-600 via-indigo-700 to-purple-800 p-5 flex flex-col z-50">
          {/* Logo */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white tracking-tight">AgriWatch</h2>
            <p className="text-indigo-200 text-xs mt-0.5">Surveillance Agricole</p>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            <SidebarItem to={dashboardPath} icon={BarChart3} label="Dashboard" />
            {isMaintenancier ? (
              <>
                <SidebarItem to="/maintenancier/inscription" icon={UserPlus} label="Demandes" />
                <SidebarItem to="/maintenancier/agents" icon={Users} label="Agents" />
                <SidebarItem to="/maintenancier/rendezvous" icon={CalendarClock} label="Rendez-vous" />
              </>
            ) : (
              <>
                <SidebarItem to="/surveillance" icon={Camera} label="Surveillance" />
                <SidebarItem to="/reports" icon={FileText} label="Rapports" />
              </>
            )}
            <SidebarItem to="/admin/" icon={Shield} label="Admin Django" />
          </nav>

          {/* User + Logout */}
          <div className="border-t border-indigo-500/40 pt-4 mt-4">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{firstName}</p>
                <p className="text-xs text-indigo-200 truncate">{roleLabel}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start gap-3 text-indigo-100 hover:bg-white/10 hover:text-white rounded-xl px-4 py-3"
              onClick={() => {
                localStorage.removeItem("access_token")
                localStorage.removeItem("refresh_token")
                localStorage.removeItem("user")
                window.location.href = "/login"
              }}
            >
              <LogOut className="h-5 w-5" />
              Déconnexion
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-[260px] flex-1 min-h-screen">
          {/* Top Bar */}
          <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Bonjour, {firstName} !</h2>
                <p className="text-sm text-gray-500">Bienvenue sur votre espace de gestion</p>
              </div>
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 border-0 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                  />
                </div>
                {/* Notifications */}
                <button className="relative p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                    3
                  </span>
                </button>
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {firstName.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
