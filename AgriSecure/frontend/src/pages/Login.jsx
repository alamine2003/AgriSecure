import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import client from '../api/client';
import { LockKeyhole, Mail, ShieldCheck, Radio, Activity, ArrowRight, ArrowLeft, KeyRound } from "lucide-react"
import logoSvg from "@/assets/logo.svg"

import { Button } from "@/components/ui/button"
import { FloatingInput } from "@/components/ui/floating-input"
import { notify } from "@/lib/notify"
import loginField from "@/assets/login-field.jpg"

const Login = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.location.hostname !== "localhost") return
    if (window.location.port !== "3000") return
    if (sessionStorage.getItem("warned_port_mismatch") === "1") return
    sessionStorage.setItem("warned_port_mismatch", "1")
    notify.warning(
      "Accès conseillé",
      "Ouvre plutôt http://localhost/ (port 80). Sinon la session peut sembler disparaître entre :3000 et :80.",
      { durationMs: 8000 }
    )
  }, [])

  const handleSubmitCredentials = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const deviceToken = localStorage.getItem('device_token') || undefined;
      const response = await client.post('/auth/login/', {
        email: normalizedEmail,
        password,
        ...(deviceToken ? { device_token: deviceToken } : {}),
      });

      if (!response.data.otp_required) {
        // Trusted device — tokens returned directly
        const { access, refresh, user } = response.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        localStorage.setItem('user', JSON.stringify(user));
        if (user.must_change_password) {
          notify.info("Action requise", "Change ton mot de passe pour continuer.", { durationMs: 5000 });
          navigate('/change-password');
        } else {
          const roleLabel = user.role === "maintenancier" ? "Maintenancier" : "Agent agricole";
          notify.success("Connecté", `Rôle: ${roleLabel}.`);
          setTimeout(() => navigate('/dashboard', { replace: true }), 100);
        }
        return;
      }

      setSessionToken(response.data.session_token);
      setStep(2);
      notify.info("Code envoyé", `Un code à 6 chiffres a été envoyé à ${normalizedEmail}.`, { durationMs: 6000 });
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        "Identifiants invalides ou compte inactif."
      notify.error("Erreur de connexion", message, { durationMs: 6000 })
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const response = await client.post('/auth/verify-otp/', {
        session_token: sessionToken,
        otp_code: otpCode,
        remember_device: rememberDevice,
      });
      const { access, refresh, user, device_token } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      if (device_token) {
        localStorage.setItem('device_token', device_token);
      }

      if (user.must_change_password) {
        notify.info("Action requise", "Change ton mot de passe pour continuer.", { durationMs: 5000 })
        navigate('/change-password');
      } else {
        const roleLabel = user.role === "maintenancier" ? "Maintenancier" : "Agent agricole"
        notify.success("Connecté", `Rôle: ${roleLabel}.`)
        setTimeout(() => navigate('/dashboard', { replace: true }), 100);
      }
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        "Code invalide ou expiré."
      notify.error("Vérification échouée", message, { durationMs: 6000 })
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      setOtpCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full grid lg:grid-cols-2 bg-slate-950 text-white overflow-hidden">
      {/* LEFT — Visual */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
        <img
          src={loginField}
          alt="Champ agricole au lever du soleil"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/85 via-slate-950/70 to-amber-900/60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.25),transparent_55%)]" />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500/20 backdrop-blur ring-1 ring-amber-300/30">
            <img src={logoSvg} alt="AgriWatch" className="h-7 w-7" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-wide">AgriWatch</p>
            <p className="text-xs text-amber-200/80">Surveillance Intelligente</p>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10 max-w-lg space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-200 ring-1 ring-amber-300/30 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Plateforme professionnelle
          </span>
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
            Protégez vos cultures.<br />
            <span className="bg-gradient-to-r from-amber-300 to-amber-200 bg-clip-text text-transparent">
              Pilotez vos champs.
            </span>
          </h1>
          <p className="text-base text-slate-200/85 leading-relaxed">
            Une surveillance temps réel par caméras connectées, des alertes
            instantanées et une gestion centralisée pour les agents et
            maintenanciers du terrain.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: Radio, label: "Live 24/7" },
              { icon: ShieldCheck, label: "Sécurisé" },
              { icon: Activity, label: "Alertes IA" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-start gap-2 rounded-xl bg-white/5 p-3 ring-1 ring-white/10 backdrop-blur"
              >
                <Icon className="h-4 w-4 text-amber-300" />
                <span className="text-xs font-medium text-slate-100">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-300/70">
          <span>© {new Date().getFullYear()} AgriWatch — Tous droits réservés</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Tous systèmes opérationnels
          </span>
        </div>
      </div>

      {/* RIGHT — Form (force light) */}
      <div className="relative flex items-center justify-center px-6 py-10 sm:px-12 bg-gradient-to-br from-slate-50 to-amber-50/40 text-slate-900 login-light">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.12),transparent_55%)]" />

        {/* Back button + Mobile brand */}
        <div className="absolute top-6 left-6 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-600/10 text-amber-700">
              <img src={logoSvg} alt="AgriWatch" className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-slate-800">AgriWatch</span>
          </div>
        </div>

        <div className={`relative z-10 w-full max-w-md ${shake ? "animate-shake" : ""}`}>
          <div className="mb-8 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              {step === 1 ? "Espace sécurisé" : "Vérification en 2 étapes"}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {step === 1 ? "Bienvenue" : "Code OTP"}
            </h2>
            <p className="text-sm text-slate-600">
              {step === 1
                ? "Connectez-vous pour accéder à votre tableau de bord de surveillance."
                : `Entrez le code à 6 chiffres envoyé à ${email.trim().toLowerCase()}.`}
            </p>
          </div>

          {step === 1 ? (
            <form className="space-y-4" onSubmit={handleSubmitCredentials}>
              <FloatingInput
                id="email"
                label="Email professionnel"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftSlot={<Mail className="h-4 w-4 text-muted-foreground" />}
              />

              <FloatingInput
                id="password"
                label="Mot de passe"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                shake={shake}
                leftSlot={<LockKeyhole className="h-4 w-4 text-muted-foreground" />}
              />

              <Button
                type="submit"
                disabled={loading}
                className="group w-full h-11 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20"
              >
                {loading ? "Vérification..." : (
                  <>
                    Continuer
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <button
                  type="button"
                  className="font-medium text-amber-700 hover:text-amber-800 hover:underline underline-offset-4"
                  onClick={() =>
                    notify.info(
                      "Mot de passe oublié",
                      "Contacte un maintenancier pour réinitialiser ton accès."
                    )
                  }
                >
                  Mot de passe oublié ?
                </button>
                <a
                  className="hover:underline underline-offset-4"
                  href="/admin/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Admin Django →
                </a>
              </div>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleVerifyOTP}>
              <FloatingInput
                id="otp"
                label="Code à 6 chiffres"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                shake={shake}
                leftSlot={<KeyRound className="h-4 w-4 text-muted-foreground" />}
              />

              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 accent-amber-600 cursor-pointer"
                />
                <span className="text-xs text-slate-600 group-hover:text-slate-800 transition-colors">
                  Se souvenir de cet appareil pendant 30 jours
                </span>
              </label>

              <Button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="group w-full h-11 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20"
              >
                {loading ? "Vérification..." : (
                  <>
                    Valider le code
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-xs font-medium text-amber-700 hover:text-amber-800 hover:underline underline-offset-4"
                  onClick={() => { setStep(1); setOtpCode(''); setSessionToken(''); }}
                >
                  ← Retour / Renvoyer le code
                </button>
              </div>
            </form>
          )}

          <div className="mt-10 flex items-center gap-3 rounded-xl border border-slate-200 bg-white/60 p-3 backdrop-blur">
            <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs text-slate-600 leading-relaxed">
              Connexion chiffrée en 2 étapes. Vos données et celles de vos exploitations
              restent confidentielles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
