import { BarChart2, TrendingUp, Target, CheckCircle2, AlertTriangle, Activity, Download, Camera } from 'lucide-react'
import { LoadingSpinner } from '../atoms/LoadingSpinner'

const SEVERITY_COLORS = { HIGH: '#E24B4A', MEDIUM: '#EF9F27', LOW: '#639922' }
const SEVERITY_LABELS  = { HIGH: 'Élevé',  MEDIUM: 'Moyen',   LOW: 'Faible' }

const LABEL_COLORS = {
  person: '#E24B4A',
  cow: '#EF9F27', horse: '#EF9F27', sheep: '#EF9F27',
  bird: '#639922', cat: '#639922',  dog: '#639922',
}

// ── Barre verticale ─────────────────────────────────────────────────────────
const BarV = ({ value, max, color, tooltip }) => {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="w-full flex items-end justify-center" style={{ height: 48 }} title={tooltip}>
      <div
        className="w-full rounded-t transition-all duration-500"
        style={{ height: `${pct}%`, minHeight: value > 0 ? 2 : 0, background: color }}
      />
    </div>
  )
}

// ── Distribution par heure ───────────────────────────────────────────────────
const HourChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.count), 1)
  const nightHours = new Set([0,1,2,3,4,5,22,23])
  return (
    <div>
      <p className="text-xs font-medium text-foreground mb-2">Distribution par heure</p>
      <div className="flex items-end gap-px" style={{ height: 56 }}>
        {data.map(({ hour, count }) => (
          <div key={hour} className="flex-1">
            <BarV
              value={count}
              max={max}
              color={nightHours.has(hour) ? '#6366f1' : '#10b981'}
              tooltip={`${hour}h — ${count} détection${count !== 1 ? 's' : ''}`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        {[0, 6, 12, 18, 23].map(h => (
          <span key={h} className="text-[10px] text-muted-foreground">{h}h</span>
        ))}
      </div>
      <div className="flex gap-3 mt-2">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="w-2 h-2 rounded-sm bg-indigo-500 inline-block" /> Nuit
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Jour
        </span>
      </div>
    </div>
  )
}

// ── Tendance sur la période sélectionnée ────────────────────────────────────
const PeriodChart = ({ data, days }) => {
  if (!data || data.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-4">Aucune donnée sur la période</p>
  }

  const maxVal = Math.max(...data.map(d => d.total || 0), 1)

  const fmtLabel = (dateStr, idx) => {
    const d = new Date(dateStr)
    if (days <= 7)  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
    if (days <= 30) return idx % 5 === 0 ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''
    return idx % 7 === 0 ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''
  }

  return (
    <div>
      <p className="text-xs font-medium text-foreground mb-2">
        Tendance — {days} derniers jours
      </p>
      <div className="flex items-end gap-px overflow-hidden" style={{ height: 56 }}>
        {data.map((d, i) => {
          const total = d.total || 0
          const pctH = maxVal > 0 ? ((d.HIGH || 0) / maxVal) * 100 : 0
          const pctM = maxVal > 0 ? ((d.MEDIUM || 0) / maxVal) * 100 : 0
          const pctL = maxVal > 0 ? ((d.LOW || 0) / maxVal) * 100 : 0
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-px"
              title={`${new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${total} détection${total !== 1 ? 's' : ''}`}
            >
              <div className="w-full flex flex-col items-center justify-end" style={{ height: 48 }}>
                {d.HIGH   > 0 && <div className="w-full rounded-t-sm" style={{ height: `${pctH}%`, background: SEVERITY_COLORS.HIGH }} />}
                {d.MEDIUM > 0 && <div className="w-full" style={{ height: `${pctM}%`, background: SEVERITY_COLORS.MEDIUM }} />}
                {d.LOW    > 0 && <div className="w-full" style={{ height: `${pctL}%`, minHeight: 2, background: SEVERITY_COLORS.LOW }} />}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-1 overflow-hidden">
        {data.map((d, i) => (
          <span key={i} className="text-[9px] text-muted-foreground text-center flex-1 truncate">
            {fmtLabel(d.date, i)}
          </span>
        ))}
      </div>
      <div className="flex gap-3 mt-2">
        {Object.entries(SEVERITY_LABELS).map(([k, l]) => (
          <span key={k} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: SEVERITY_COLORS[k] }} /> {l}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Répartition par niveau de danger ────────────────────────────────────────
const DangerDistribution = ({ byDay }) => {
  if (!byDay || byDay.length === 0) return (
    <p className="text-xs text-muted-foreground text-center py-4">Aucune donnée</p>
  )

  const highTotal = byDay.reduce((s, d) => s + (d.HIGH   || 0), 0)
  const medTotal  = byDay.reduce((s, d) => s + (d.MEDIUM || 0), 0)
  const lowTotal  = byDay.reduce((s, d) => s + (d.LOW    || 0), 0)
  const total     = highTotal + medTotal + lowTotal

  if (total === 0) return (
    <p className="text-xs text-muted-foreground text-center py-4">Aucune détection</p>
  )

  return (
    <div className="space-y-2.5">
      {[
        { key: 'HIGH',   label: 'Élevé', count: highTotal },
        { key: 'MEDIUM', label: 'Moyen', count: medTotal  },
        { key: 'LOW',    label: 'Faible', count: lowTotal },
      ].map(({ key, label, count }) => {
        const pct = Math.round((count / total) * 100)
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs font-medium w-12" style={{ color: SEVERITY_COLORS[key] }}>{label}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: SEVERITY_COLORS[key] }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground w-16 text-right">
              {count} <span className="opacity-60">({pct}%)</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Top labels ───────────────────────────────────────────────────────────────
const TopLabels = ({ labels }) => {
  if (!labels || labels.length === 0) return null
  const max = Math.max(...labels.map(l => l.count), 1)
  return (
    <div className="space-y-1.5">
      {labels.map(({ label, count }) => (
        <div key={label} className="flex items-center gap-2">
          <span className="text-xs text-foreground w-16 truncate capitalize">{label}</span>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(count / max) * 100}%`, background: LABEL_COLORS[label] || '#6366f1' }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground w-6 text-right">{count}</span>
        </div>
      ))}
    </div>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, unit = '%', icon: Icon, color = 'text-primary', subtitle }) => (
  <div className="bg-card border border-border/50 rounded-xl p-3 flex flex-col gap-1">
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <Icon className={`w-3.5 h-3.5 ${color}`} />
    </div>
    <div className={`text-2xl font-bold ${color}`}>{value}{unit}</div>
    {subtitle && <div className="text-[10px] text-muted-foreground">{subtitle}</div>}
  </div>
)

// ── Composant principal ──────────────────────────────────────────────────────
export const AnalyticsSection = ({ analytics, isLoading, days, onDaysChange, onExportCSV }) => {
  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border/50 p-6">
        <LoadingSpinner icon={BarChart2} text="Chargement des statistiques..." size="sm" />
      </div>
    )
  }

  if (!analytics) return null

  const qm = analytics.quality_metrics || {}

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      {/* Header avec toolbar intégrée */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Statistiques & Analytics</span>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {analytics.period_days}j — {qm.total_detections ?? 0} dét.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => onDaysChange?.(d)}
                className={`text-xs px-2 py-0.5 rounded-lg transition-colors ${
                  days === d
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {d}j
              </button>
            ))}
          </div>
          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Taux réel"
            value={qm.total_detections > 0 ? (100 - (qm.false_positive_rate ?? 0)).toFixed(1) : '—'}
            icon={Target}
            color="text-emerald-500"
            subtitle={`${qm.confirmed_detections ?? 0} non marquées FP`}
          />
          <KpiCard
            label="Faux positifs"
            value={qm.false_positive_rate ?? 0}
            icon={AlertTriangle}
            color={qm.false_positive_rate > 20 ? 'text-destructive' : 'text-amber-500'}
            subtitle={`${qm.false_positives ?? 0} sur ${qm.total_detections ?? 0}`}
          />
          <KpiCard
            label="Alertes résolues"
            value={qm.alert_resolution_rate ?? 0}
            icon={CheckCircle2}
            color="text-primary"
            subtitle={`${qm.resolved_alerts ?? 0} / ${qm.total_alerts ?? 0}`}
          />
          <KpiCard
            label="Confiance moy."
            value={qm.avg_confidence ?? 0}
            icon={Activity}
            color="text-indigo-400"
            subtitle="Score YOLO moyen"
          />
        </div>

        {/* Tendance période + Heures */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-muted/20 rounded-xl p-3">
            <PeriodChart data={analytics.by_day || []} days={days ?? analytics.period_days ?? 30} />
          </div>
          <div className="bg-muted/20 rounded-xl p-3">
            <HourChart data={analytics.by_hour || []} />
          </div>
        </div>

        {/* Répartition niveaux + Top labels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-muted/20 rounded-xl p-3">
            <p className="text-xs font-medium text-foreground mb-3 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" /> Répartition par niveau de danger
            </p>
            <DangerDistribution byDay={analytics.by_day} />
          </div>

          {analytics.top_labels?.length > 0 && (
            <div className="bg-muted/20 rounded-xl p-3">
              <p className="text-xs font-medium text-foreground mb-3 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-primary" /> Top objets détectés (confirmés)
              </p>
              <TopLabels labels={analytics.top_labels} />
            </div>
          )}
        </div>

        {/* Performance par caméra */}
        {analytics.camera_performance?.length > 0 && (
          <div className="bg-muted/20 rounded-xl p-3">
            <p className="text-xs font-medium text-foreground mb-3 flex items-center gap-1">
              <Camera className="w-3 h-3 text-primary" /> Performance par caméra
            </p>
            <div className="space-y-2">
              {analytics.camera_performance.slice(0, 5).map((cam, i) => {
                const fpRate   = cam.total > 0 ? Math.round((cam.fp   / cam.total) * 100) : 0
                const highRate = cam.total > 0 ? Math.round((cam.high / cam.total) * 100) : 0
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-foreground truncate flex-1 min-w-0">
                      {cam.name}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[11px] text-muted-foreground">{cam.total} dét.</span>
                      {cam.avg_confidence != null && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-indigo-500/10 text-indigo-400">
                          {cam.avg_confidence}% conf.
                        </span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        highRate > 50
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {highRate}% élevé
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        fpRate > 20
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {fpRate}% FP
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
