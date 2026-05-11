import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, CheckCheck, Trash2, Zap, AlertTriangle, CheckCircle, Info, X, Filter } from 'lucide-react'
import client from '@/api/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { notify } from '@/lib/notify'

const TYPES = [
  { value: '', label: 'Toutes' },
  { value: 'ALERT', label: 'Alertes' },
  { value: 'WARNING', label: 'Avertissements' },
  { value: 'INFO', label: 'Informations' },
  { value: 'SUCCESS', label: 'Succès' },
  { value: 'ERROR', label: 'Erreurs' },
]

const TYPE_META = {
  ALERT:   { icon: Zap,           color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
  SUCCESS: { icon: CheckCircle,   color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  ERROR:   { icon: X,             color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
  INFO:    { icon: Info,          color: 'text-sky-400',    bg: 'bg-sky-500/10',    border: 'border-sky-500/20' },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "à l'instant"
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export default function AgentInbox() {
  const [filter, setFilter] = useState('')
  const [showUnread, setShowUnread] = useState(false)
  const qc = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', filter, showUnread],
    queryFn: async () => {
      const params = new URLSearchParams({ ordering: '-created_at' })
      if (filter) params.set('notification_type', filter)
      if (showUnread) params.set('is_read', 'false')
      const res = await client.get(`/notifications/notifications/?${params}`)
      return Array.isArray(res.data) ? res.data : res.data?.results || []
    },
    refetchInterval: 30000,
  })

  const markRead = useMutation({
    mutationFn: (id) => client.post(`/notifications/notifications/${id}/mark_read/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllRead = useMutation({
    mutationFn: () => client.post('/notifications/notifications/mark_all_read/'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      notify.success('Succès', 'Toutes les notifications ont été marquées comme lues')
    },
  })

  const deleteNotif = useMutation({
    mutationFn: (id) => client.delete(`/notifications/notifications/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/[0.07] via-card to-blue-500/[0.04]" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-500/[0.06] rounded-full blur-[80px]" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-full text-xs font-medium text-sky-400 mb-3">
              <Bell className="w-3.5 h-3.5" />
              Centre de notifications
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Boîte de réception</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes vos notifications'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl shadow-lg shadow-sky-500/20 border-0"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Tout marquer lu
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-xl border border-border/50">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filter === t.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowUnread((v) => !v)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all',
            showUnread
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-muted/50 border-border/50 text-muted-foreground hover:text-foreground'
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          Non lues seulement
        </button>
      </div>

      {/* List */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-500/10 flex items-center justify-center mb-3 animate-pulse">
              <Bell className="w-6 h-6 text-sky-400" />
            </div>
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Aucune notification</p>
            <p className="text-xs text-muted-foreground">Vous êtes à jour !</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {notifications.map((n) => {
              const meta = TYPE_META[n.notification_type] || TYPE_META.INFO
              const Icon = meta.icon
              return (
                <div
                  key={n.id}
                  className={cn(
                    'flex items-start gap-4 p-5 hover:bg-muted/20 transition-colors group',
                    !n.is_read && 'bg-primary/[0.02]'
                  )}
                >
                  <div className={cn('mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border', meta.bg, meta.border)}>
                    <Icon className={cn('w-5 h-5', meta.color)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm leading-snug', n.is_read ? 'text-muted-foreground' : 'text-foreground font-semibold')}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground/60 shrink-0">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                    {n.priority === 'URGENT' && (
                      <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                        <Zap className="w-3 h-3" /> Urgent
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!n.is_read && (
                      <button
                        onClick={() => markRead.mutate(n.id)}
                        title="Marquer comme lu"
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotif.mutate(n.id)}
                      title="Supprimer"
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
