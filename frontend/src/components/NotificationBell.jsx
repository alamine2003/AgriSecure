import { useState, useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck, X, AlertTriangle, Info, CheckCircle, Zap } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import { cn } from '@/lib/utils'

const TYPE_ICON = {
  ALERT:   { icon: Zap,           color: 'text-red-400',    bg: 'bg-red-500/10' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  SUCCESS: { icon: CheckCircle,   color: 'text-green-400',  bg: 'bg-green-500/10' },
  ERROR:   { icon: X,             color: 'text-red-400',    bg: 'bg-red-500/10' },
  INFO:    { icon: Info,          color: 'text-sky-400',    bg: 'bg-sky-500/10' },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'à l\'instant'
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const qc = useQueryClient()

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await client.get('/notifications/notifications/?ordering=-created_at')
      return Array.isArray(res.data) ? res.data : res.data?.results || []
    },
    refetchInterval: 30000,
  })

  const unread = notifications.filter((n) => !n.is_read).length

  const markRead = useMutation({
    mutationFn: (id) => client.post(`/notifications/notifications/${id}/mark_read/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllRead = useMutation({
    mutationFn: () => client.post('/notifications/notifications/mark_all_read/'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const recent = notifications.slice(0, 8)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2.5 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors"
      >
        <Bell className="w-[18px] h-[18px] text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center px-0.5 ring-2 ring-background">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-card border border-border/50 rounded-2xl shadow-2xl shadow-black/20 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div>
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              {unread > 0 && (
                <p className="text-[11px] text-muted-foreground">{unread} non lue{unread > 1 ? 's' : ''}</p>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tout lire
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto">
            {recent.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucune notification</p>
              </div>
            ) : (
              recent.map((n) => {
                const meta = TYPE_ICON[n.notification_type] || TYPE_ICON.INFO
                const Icon = meta.icon
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer group',
                      !n.is_read && 'bg-primary/[0.03]'
                    )}
                    onClick={() => !n.is_read && markRead.mutate(n.id)}
                  >
                    <div className={cn('mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0', meta.bg)}>
                      <Icon className={cn('w-4 h-4', meta.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm leading-snug', n.is_read ? 'text-muted-foreground' : 'text-foreground font-medium')}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 8 && (
            <div className="px-4 py-2.5 border-t border-border/50 text-center">
              <a href="/agent/inbox" className="text-xs text-primary hover:underline font-medium">
                Voir toutes les notifications ({notifications.length})
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
