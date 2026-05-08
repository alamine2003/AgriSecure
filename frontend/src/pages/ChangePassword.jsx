import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { Shield, Lock, AlertTriangle, CheckCircle, Eye, EyeOff, Sparkles } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FloatingInput } from "@/components/ui/floating-input"
import { notify } from "@/lib/notify"

const ChangePasswordV3 = () => {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const passwordStrength = (password) => {
    if (!password) return { level: 0, label: '', color: '' }

    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++

    const levels = [
      { level: 0, label: 'Très faible', color: 'bg-red-500' },
      { level: 1, label: 'Faible', color: 'bg-orange-500' },
      { level: 2, label: 'Moyen', color: 'bg-yellow-500' },
      { level: 3, label: 'Bon', color: 'bg-blue-500' },
      { level: 4, label: 'Fort', color: 'bg-green-500' },
      { level: 5, label: 'Très fort', color: 'bg-emerald-600' },
    ]

    return levels[Math.min(strength, 5)]
  }

  const strength = passwordStrength(newPassword)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      notify.warning("Mot de passe faible", "Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    if (newPassword !== confirmPassword) {
      notify.warning("Vérification", "Les mots de passe ne correspondent pas.")
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }

    setLoading(true)

    try {
      await client.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      })

      // Mettre à jour l'utilisateur localement
      const updatedUser = { ...user, must_change_password: false }
      localStorage.setItem('user', JSON.stringify(updatedUser))

      notify.success("Succès", "Mot de passe modifié avec succès!")

      // Rediriger vers le dashboard approprié
      if (user.role === 'agent_agricole') {
        navigate('/agent/dashboard')
      } else if (user.role === 'maintenancier') {
        navigate('/maintenancier/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      const message =
        err?.response?.data?.old_password?.[0] ||
        err?.response?.data?.new_password?.[0] ||
        err?.response?.data?.confirm_password?.[0] ||
        err?.response?.data?.detail ||
        "Erreur lors du changement de mot de passe."
      notify.error("Erreur", message, { durationMs: 6000 })
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10 bg-gradient-to-br from-gray-50 via-white to-green-50">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.15),transparent_45%),radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.10),transparent_50%)]" />
      </div>

      <div className="w-full max-w-lg">
        {/* Header Card */}
        <div className="mb-6 bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-green-900 bg-clip-text text-transparent">
                Sécurité du Compte
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <Sparkles className="w-4 h-4 text-green-500" />
                Première connexion détectée
              </p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <Card className={`bg-white/90 backdrop-blur-xl border-2 border-white/20 shadow-2xl ${shake ? "animate-shake" : ""}`}>
          <CardHeader className="space-y-2 border-b-2 border-dashed bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Lock className="w-6 h-6 text-green-600" />
              Changement de Mot de Passe Requis
            </CardTitle>
            <CardDescription className="text-sm">
              Pour sécuriser votre compte, veuillez définir un nouveau mot de passe personnel.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Alert Info */}
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Mot de passe actuel : Votre NIN
                  </p>
                  <p className="text-xs text-blue-800">
                    Votre mot de passe initial est votre Numéro d'Identification National (NIN).
                    Choisissez un nouveau mot de passe fort et unique.
                  </p>
                </div>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Ancien mot de passe */}
              <div className="relative">
                <FloatingInput
                  id="old_password"
                  label="Ancien mot de passe (NIN)"
                  type={showOld ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  shake={shake}
                  icon={<Lock className="w-4 h-4" />}
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showOld ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Nouveau mot de passe */}
              <div className="space-y-2">
                <div className="relative">
                  <FloatingInput
                    id="new_password"
                    label="Nouveau mot de passe"
                    type={showNew ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Force du mot de passe */}
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Force du mot de passe:</span>
                      <span className={`font-bold ${
                        strength.level >= 4 ? 'text-green-600' :
                        strength.level >= 3 ? 'text-blue-600' :
                        strength.level >= 2 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${strength.color}`}
                        style={{ width: `${(strength.level / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Recommandations */}
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Recommandations:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li className={`flex items-center gap-2 ${newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                      {newPassword.length >= 8 ? <CheckCircle className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border-2 border-gray-400" />}
                      Au moins 8 caractères
                    </li>
                    <li className={`flex items-center gap-2 ${/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                      {/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? <CheckCircle className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border-2 border-gray-400" />}
                      Majuscules et minuscules
                    </li>
                    <li className={`flex items-center gap-2 ${/[0-9]/.test(newPassword) ? 'text-green-600' : ''}`}>
                      {/[0-9]/.test(newPassword) ? <CheckCircle className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border-2 border-gray-400" />}
                      Au moins un chiffre
                    </li>
                    <li className={`flex items-center gap-2 ${/[^a-zA-Z0-9]/.test(newPassword) ? 'text-green-600' : ''}`}>
                      {/[^a-zA-Z0-9]/.test(newPassword) ? <CheckCircle className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border-2 border-gray-400" />}
                      Caractère spécial (@, #, !, etc.)
                    </li>
                  </ul>
                </div>
              </div>

              {/* Confirmation */}
              <div className="relative">
                <FloatingInput
                  id="confirm_password"
                  label="Confirmer le mot de passe"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Match indicator */}
              {confirmPassword && (
                <div className={`p-3 rounded-lg border-2 ${
                  newPassword === confirmPassword
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className={`text-xs font-semibold flex items-center gap-2 ${
                    newPassword === confirmPassword ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {newPassword === confirmPassword ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Les mots de passe correspondent
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        Les mots de passe ne correspondent pas
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 py-6 text-lg"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enregistrement...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Valider le Nouveau Mot de Passe
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Votre mot de passe est crypté et sécurisé. Il ne sera jamais partagé.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChangePasswordV3
