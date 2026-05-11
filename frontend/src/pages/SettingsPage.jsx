import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, Bell, User, Shield, Mail, Phone, Save, Eye, EyeOff, Check } from 'lucide-react'
import client from '@/api/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FloatingInput } from '@/components/ui/floating-input'
import { notify } from '@/lib/notify'

const CHANNEL_TYPES = [
  { id: 'EMAIL', label: 'Email',    icon: Mail,  desc: 'Recevoir les alertes par email' },
  { id: 'SMS',   label: 'SMS',      icon: Phone, desc: 'Recevoir les alertes par SMS' },
]

const TABS = [
  { id: 'profile',       label: 'Profil',        icon: User },
  { id: 'password',      label: 'Mot de passe',  icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

export default function SettingsPage() {
  const [tab, setTab] = useState('profile')
  const qc = useQueryClient()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // ── Profile ──────────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone: user.phone || '',
  })

  const updateProfile = useMutation({
    mutationFn: (data) => client.patch('/auth/profile/', data),
    onSuccess: (res) => {
      const updated = { ...user, ...res.data }
      localStorage.setItem('user', JSON.stringify(updated))
      notify.success('Profil mis à jour', 'Vos informations ont été enregistrées')
    },
    onError: () => notify.error('Erreur', 'Impossible de mettre à jour le profil'),
  })

  // ── Password ─────────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)

  const changePassword = useMutation({
    mutationFn: (data) => client.post('/auth/change-password/', {
      old_password: data.current_password,
      new_password: data.new_password,
    }),
    onSuccess: () => {
      notify.success('Mot de passe modifié', 'Votre mot de passe a été mis à jour')
      setPwForm({ current_password: '', new_password: '', confirm: '' })
    },
    onError: (err) => notify.error('Erreur', err?.response?.data?.detail || 'Vérifiez votre mot de passe actuel'),
  })

  const handlePasswordSubmit = () => {
    if (!pwForm.current_password || !pwForm.new_password) {
      notify.error('Erreur', 'Tous les champs sont requis')
      return
    }
    if (pwForm.new_password !== pwForm.confirm) {
      notify.error('Erreur', 'Les mots de passe ne correspondent pas')
      return
    }
    if (pwForm.new_password.length < 8) {
      notify.error('Erreur', 'Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    changePassword.mutate(pwForm)
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  const { data: channels = [] } = useQuery({
    queryKey: ['notification-channels'],
    queryFn: async () => {
      const res = await client.get('/notifications/channels/')
      return Array.isArray(res.data) ? res.data : res.data?.results || []
    },
    enabled: tab === 'notifications',
  })

  const toggleChannel = useMutation({
    mutationFn: async ({ channelType, enabled, config }) => {
      const existing = channels.find((c) => c.channel_type === channelType)
      if (existing) {
        return client.patch(`/notifications/channels/${existing.id}/`, { is_enabled: enabled, configuration: config || existing.configuration })
      }
      return client.post('/notifications/channels/', { channel_type: channelType, is_enabled: enabled, configuration: config || {} })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-channels'] })
      notify.success('Préférences sauvegardées', '')
    },
  })

  const [channelConfig, setChannelConfig] = useState({ EMAIL: {}, SMS: {} })

  useEffect(() => {
    const cfg = { EMAIL: {}, SMS: {} }
    channels.forEach((c) => { cfg[c.channel_type] = c.configuration || {} })
    setChannelConfig(cfg)
  }, [channels])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.07] via-card to-purple-500/[0.04]" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/[0.06] rounded-full blur-[80px]" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full text-xs font-medium text-violet-400 mb-3">
            <Settings className="w-3.5 h-3.5" />
            Paramètres
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Paramètres du compte</h1>
          <p className="mt-2 text-sm text-muted-foreground">Gérez votre profil, sécurité et préférences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar tabs */}
        <div className="bg-card border border-border/50 rounded-2xl p-3 h-fit space-y-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                tab === id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-card border border-border/50 rounded-2xl p-6">

          {/* Profile tab */}
          {tab === 'profile' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">Informations personnelles</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Mettez à jour vos informations de profil</p>
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-amber-500/20">
                  {(user.first_name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{user.first_name} {user.last_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-[11px] text-amber-400 mt-0.5">{user.role === 'maintenancier' ? 'Maintenancier' : 'Agent agricole'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  id="first_name"
                  label="Prénom"
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm((f) => ({ ...f, first_name: e.target.value }))}
                />
                <FloatingInput
                  id="last_name"
                  label="Nom"
                  value={profileForm.last_name}
                  onChange={(e) => setProfileForm((f) => ({ ...f, last_name: e.target.value }))}
                />
                <FloatingInput
                  id="email"
                  label="Email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                />
                <FloatingInput
                  id="phone"
                  label="Téléphone (optionnel)"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+221 7X XXX XX XX"
                />
              </div>

              <Button
                onClick={() => updateProfile.mutate(profileForm)}
                disabled={updateProfile.isPending}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl shadow-lg shadow-amber-500/20 border-0"
              >
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          )}

          {/* Password tab */}
          {tab === 'password' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">Changer le mot de passe</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Choisissez un mot de passe fort d'au moins 8 caractères</p>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="relative">
                  <FloatingInput
                    id="current_password"
                    label="Mot de passe actuel"
                    type={showPw ? 'text' : 'password'}
                    value={pwForm.current_password}
                    onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FloatingInput
                  id="new_password"
                  label="Nouveau mot de passe"
                  type="password"
                  value={pwForm.new_password}
                  onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
                />
                <FloatingInput
                  id="confirm"
                  label="Confirmer le nouveau mot de passe"
                  type="password"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                />
              </div>

              <Button
                onClick={handlePasswordSubmit}
                disabled={changePassword.isPending}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl shadow-lg shadow-amber-500/20 border-0"
              >
                <Shield className="w-4 h-4 mr-2" />
                Modifier le mot de passe
              </Button>
            </div>
          )}

          {/* Notifications tab */}
          {tab === 'notifications' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">Canaux de notification</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Choisissez comment recevoir les alertes de surveillance</p>
              </div>

              <div className="space-y-4">
                {CHANNEL_TYPES.map(({ id, label, icon: Icon, desc }) => {
                  const channel = channels.find((c) => c.channel_type === id)
                  const enabled = channel?.is_enabled ?? false
                  const config = channelConfig[id] || {}

                  return (
                    <div key={id} className="border border-border/50 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{label}</p>
                            <p className="text-xs text-muted-foreground">{desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleChannel.mutate({ channelType: id, enabled: !enabled, config })}
                          className={cn(
                            'relative w-11 h-6 rounded-full transition-colors',
                            enabled ? 'bg-primary' : 'bg-muted/70'
                          )}
                        >
                          <div className={cn(
                            'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                            enabled ? 'translate-x-5' : 'translate-x-0.5'
                          )} />
                        </button>
                      </div>

                      {enabled && (
                        <div className="space-y-3 pt-3 border-t border-border/50">
                          {id === 'EMAIL' && (
                            <FloatingInput
                              id={`email-cfg`}
                              label="Email de notification (optionnel)"
                              type="email"
                              value={config.email || ''}
                              onChange={(e) => setChannelConfig((c) => ({ ...c, EMAIL: { ...c.EMAIL, email: e.target.value } }))}
                              placeholder={user.email}
                            />
                          )}
                          {id === 'SMS' && (
                            <FloatingInput
                              id={`phone-cfg`}
                              label="Numéro de téléphone"
                              value={config.phone || ''}
                              onChange={(e) => setChannelConfig((c) => ({ ...c, SMS: { ...c.SMS, phone: e.target.value } }))}
                              placeholder="+221 7X XXX XX XX"
                            />
                          )}
                          <Button
                            size="sm"
                            onClick={() => toggleChannel.mutate({ channelType: id, enabled: true, config })}
                            className="rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border-0 shadow-none"
                          >
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                            Sauvegarder
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
