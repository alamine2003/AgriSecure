import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Archive, AlertTriangle, Camera, Eye, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import client from '@/api/client'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'detections', label: 'Détections', icon: Camera },
  { id: 'alerts', label: 'Alertes', icon: AlertTriangle },
]

const DANGER_META = {
  HIGH:   { label: 'Élevé',  color: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/20' },
  MEDIUM: { label: 'Moyen',  color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  LOW:    { label: 'Faible', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function DetectionRow({ d }) {
  const [open, setOpen] = useState(false)
  const meta = DANGER_META[d.danger_level] || DANGER_META.LOW

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border', meta.bg, meta.border)}>
          <Camera className={cn('w-4 h-4', meta.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">{d.label}</span>
            <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', meta.bg, meta.color, meta.border)}>
              {meta.label}
            </span>
            {d.is_alert && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                Alerte
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {d.camera?.name || '—'} · {formatDate(d.detected_at)}
          </p>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{Math.round((d.confidence || 0) * 100)}%</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </div>

      {open && (
        <div className="border-t border-border/50 p-4 bg-muted/10 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Confiance', value: `${Math.round((d.confidence || 0) * 100)}%` },
            { label: 'Niveau', value: meta.label },
            { label: 'Caméra', value: d.camera?.name || '—' },
            { label: 'Date', value: formatDate(d.detected_at) },
          ].map((s) => (
            <div key={s.label} className="p-3 bg-card border border-border/50 rounded-xl">
              <p className="text-[10px] text-muted-foreground uppercase mb-0.5">{s.label}</p>
              <p className="text-sm font-semibold text-foreground">{s.value}</p>
            </div>
          ))}
          {d.frame_capture && (
            <div className="col-span-full">
              <a
                href={d.frame_capture}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
              >
                <Eye className="w-3.5 h-3.5" />
                Voir la capture
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AlertRow({ a }) {
  return (
    <div className="flex items-start gap-4 p-5 border border-border/50 rounded-xl hover:bg-muted/10 transition-colors">
      <div className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border',
        a.is_read ? 'bg-muted/50 border-border/50' : 'bg-red-500/10 border-red-500/20'
      )}>
        <AlertTriangle className={cn('w-4 h-4', a.is_read ? 'text-muted-foreground' : 'text-red-400')} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground line-clamp-2">{a.message}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(a.created_at)}
          </span>
          {a.resolved_at && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
              Résolue
            </span>
          )}
          {a.is_read && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/50 border border-border/50 text-muted-foreground">
              Lue
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ArchivePage() {
  const [tab, setTab] = useState('detections')

  const { data: detections = [], isLoading: loadDet } = useQuery({
    queryKey: ['detections-archive'],
    queryFn: async () => {
      const res = await client.get('/surveillance/detections/?ordering=-detected_at&limit=50')
      return Array.isArray(res.data) ? res.data : res.data?.results || []
    },
    enabled: tab === 'detections',
  })

  const { data: alerts = [], isLoading: loadAlert } = useQuery({
    queryKey: ['alerts-archive'],
    queryFn: async () => {
      const res = await client.get('/surveillance/alerts/?ordering=-created_at&limit=50')
      return Array.isArray(res.data) ? res.data : res.data?.results || []
    },
    enabled: tab === 'alerts',
  })

  const isLoading = tab === 'detections' ? loadDet : loadAlert
  const items = tab === 'detections' ? detections : alerts

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.07] via-card to-purple-500/[0.04]" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/[0.06] rounded-full blur-[80px]" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full text-xs font-medium text-violet-400 mb-3">
            <Archive className="w-3.5 h-3.5" />
            Historique complet
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Archives</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Historique des détections et alertes de votre exploitation
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border/50 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === id
                ? 'bg-card border border-border/50 text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-16 text-center bg-card border border-border/50 rounded-2xl">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-500/10 flex items-center justify-center mb-3 animate-pulse">
              <Archive className="w-6 h-6 text-violet-400" />
            </div>
            <p className="text-sm text-muted-foreground">Chargement de l'historique...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center bg-card border border-border/50 rounded-2xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <Archive className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Aucun historique</p>
            <p className="text-xs text-muted-foreground">Rien à afficher pour le moment</p>
          </div>
        ) : (
          tab === 'detections'
            ? detections.map((d) => <DetectionRow key={d.id} d={d} />)
            : alerts.map((a) => <AlertRow key={a.id} a={a} />)
        )}
      </div>
    </div>
  )
}
