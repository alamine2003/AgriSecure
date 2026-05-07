import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import client from '../api/client';
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FloatingInput } from "@/components/ui/floating-input"
import { notify } from "@/lib/notify"

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      console.log('[LOGIN] Tentative de connexion...', { email: email.trim().toLowerCase() });

      const normalizedEmail = email.trim().toLowerCase()
      const response = await client.post('/auth/login/', { email: normalizedEmail, password });

      console.log('[LOGIN] Réponse reçue:', response.data);

      const { access, refresh, user } = response.data;

      if (!access || !refresh || !user) {
        console.error('[LOGIN] Données manquantes dans la réponse:', response.data);
        throw new Error('Réponse invalide du serveur');
      }

      console.log('[LOGIN] Sauvegarde dans localStorage...');
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));

      console.log('[LOGIN] Données sauvegardées:', {
        hasToken: !!localStorage.getItem('access_token'),
        hasUser: !!localStorage.getItem('user'),
        userRole: user.role
      });

      if (user.must_change_password) {
        console.log('[LOGIN] Redirection vers change-password');
        notify.info("Action requise", "Change ton mot de passe pour continuer.", {
          durationMs: 5000,
        })
        navigate('/change-password');
      } else {
        const roleLabel = user.role === "maintenancier" ? "Maintenancier" : "Agent agricole"
        console.log('[LOGIN] Connexion réussie, redirection vers /dashboard');
        notify.success("Connecté", `Rôle: ${roleLabel}.`)

        // Force navigation
        setTimeout(() => {
          console.log('[LOGIN] Exécution de la navigation...');
          navigate('/dashboard', { replace: true });
        }, 100);
      }
    } catch (err) {
      console.error('[LOGIN] Erreur:', err);
      console.error('[LOGIN] Détails:', {
        response: err?.response?.data,
        status: err?.response?.status,
        message: err?.message
      });

      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        err?.message ||
        "Identifiants invalides ou compte inactif."
      notify.error("Erreur de connexion", message, { durationMs: 6000 })
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.15),transparent_45%),radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.10),transparent_50%)]" />

      <Card className={`w-full max-w-md ${shake ? "animate-shake" : ""}`}>
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Surveillance Agricole</CardTitle>
              <CardDescription>Accès sécurisé au monitoring.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FloatingInput
              id="email"
              label="Email"
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <button
                type="button"
                className="underline-offset-4 hover:underline"
                onClick={() =>
                  notify.info(
                    "Mot de passe oublié",
                    "Contacte un maintenancier pour réinitialiser ton accès."
                  )
                }
              >
                Mot de passe oublié ?
              </button>

              <a className="underline-offset-4 hover:underline" href="/admin/" target="_blank" rel="noreferrer">
                Admin Django
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
