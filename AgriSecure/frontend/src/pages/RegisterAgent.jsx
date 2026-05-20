import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserPlus, ArrowLeft, ArrowRight, Leaf, MapPin, Mail, User, Hash, Home, Send,
  Check, ChevronRight
} from 'lucide-react';
import logoSvg from '../assets/logo.svg';
import { Button } from '../components/ui/button';
import { FloatingInput } from '../components/ui/floating-input';
import { PhoneInputSenegal } from '../components/ui/phone-input-senegal';
import { LocationSelector } from '../components/ui/location-selector';
import { notify } from '../lib/notify';
import client from '../api/client';
import { cn } from '../lib/utils';

const STEPS = [
  { id: 1, title: "Identité", description: "Informations personnelles", icon: User },
  { id: 2, title: "Localisation", description: "Adresse de l'exploitation", icon: MapPin },
  { id: 3, title: "Exploitation", description: "Détails agricoles", icon: Leaf },
];

export default function RegisterAgent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nin: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    region: '',
    locality: '',
    address: '',
    farm_size: ''
  });

  const handleLocationSelect = (location) => {
    setForm(f => ({
      ...f,
      region: location.region || '',
      locality: location.commune || ''
    }));
  };

  const validateStep = () => true;

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, 3));
    }
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await client.post('/surveillance/registration-requests/', form);
      notify.success(
        'Demande envoyée',
        'Votre demande d\'inscription a été envoyée avec succès. Un maintenancier va la traiter.'
      );
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      const data = err?.response?.data;
      if (data && typeof data === 'object') {
        const errors = Object.entries(data)
          .flatMap(([key, value]) => {
            if (Array.isArray(value)) return value.map(v => `${key}: ${v}`);
            if (typeof value === 'string') return [`${key}: ${value}`];
            return [];
          })
          .join(' | ');
        notify.error('Erreur', errors || 'Impossible d\'envoyer la demande');
      } else {
        notify.error('Erreur', 'Impossible d\'envoyer la demande');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0f0d]/80 backdrop-blur-2xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-amber-500/25">
              <img src={logoSvg} alt="AgriWatch" className="w-full h-full" />
            </div>
            <span className="text-lg font-bold">AgriWatch</span>
          </Link>
          <Link to="/">
            <Button variant="outline" className="rounded-xl border-white/10 text-white/70 hover:text-white hover:bg-white/[0.05] hover:border-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-5 shadow-2xl shadow-amber-500/30">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Demande d'Inscription
            </h1>
            <p className="mt-3 text-white/40 max-w-md mx-auto">
              Complétez les 3 étapes pour soumettre votre demande de compte agent agricole.
            </p>
          </div>

          {/* Stepper */}
          <div className="mb-10">
            <div className="flex items-center justify-between relative">
              {/* Line behind */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-white/[0.06]" />
              <div
                className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
              />

              {STEPS.map((s) => {
                const Icon = s.icon;
                const isCompleted = step > s.id;
                const isCurrent = step === s.id;

                return (
                  <div key={s.id} className="relative flex flex-col items-center z-10">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border-2",
                        isCompleted
                          ? "bg-gradient-to-br from-amber-500 to-orange-600 border-amber-500 shadow-lg shadow-amber-500/30"
                          : isCurrent
                            ? "bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/20"
                            : "bg-white/[0.03] border-white/[0.08]"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <Icon className={cn("w-5 h-5", isCurrent ? "text-amber-400" : "text-white/30")} />
                      )}
                    </div>
                    <p className={cn(
                      "mt-3 text-xs font-medium transition-colors",
                      isCurrent ? "text-amber-400" : isCompleted ? "text-white/70" : "text-white/30"
                    )}>
                      {s.title}
                    </p>
                    <p className="text-[10px] text-white/20 mt-0.5 hidden sm:block">{s.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 md:p-10 backdrop-blur-sm">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Identité */}
              {step === 1 && (
                <div className="space-y-5 animate-fade-up">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Informations Personnelles</h3>
                      <p className="text-xs text-white/40">Vos données d'identité</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FloatingInput
                      id="nin"
                      label="NIN (Numéro d'Identification)"
                      value={form.nin}
                      onChange={(e) => setForm(f => ({ ...f, nin: e.target.value }))}
                      required
                      leftSlot={<Hash className="w-4 h-4 text-white/40" />}
                      inputClassName="bg-white/[0.04] border-white/[0.08] focus-visible:ring-amber-500/30"
                    />
                    <FloatingInput
                      id="email"
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                      required
                      autoCapitalize="none"
                      spellCheck={false}
                      leftSlot={<Mail className="w-4 h-4 text-white/40" />}
                      inputClassName="bg-white/[0.04] border-white/[0.08] focus-visible:ring-amber-500/30"
                    />
                    <FloatingInput
                      id="first_name"
                      label="Prénom"
                      value={form.first_name}
                      onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))}
                      required
                      inputClassName="bg-white/[0.04] border-white/[0.08] focus-visible:ring-amber-500/30"
                    />
                    <FloatingInput
                      id="last_name"
                      label="Nom"
                      value={form.last_name}
                      onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))}
                      required
                      inputClassName="bg-white/[0.04] border-white/[0.08] focus-visible:ring-amber-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-2">Téléphone</label>
                    <PhoneInputSenegal
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Localisation */}
              {step === 2 && (
                <div className="space-y-5 animate-fade-up">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Localisation</h3>
                      <p className="text-xs text-white/40">Où se trouve votre exploitation ?</p>
                    </div>
                  </div>

                  <LocationSelector
                    onLocationSelect={handleLocationSelect}
                    initialRegion={form.region}
                    initialCommune={form.locality}
                    showGPS={false}
                  />

                  <FloatingInput
                    id="address"
                    label="Adresse complète (optionnel)"
                    value={form.address}
                    onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                    leftSlot={<Home className="w-4 h-4 text-white/40" />}
                    inputClassName="bg-white/[0.04] border-white/[0.08] focus-visible:ring-amber-500/30"
                  />
                </div>
              )}

              {/* Step 3: Exploitation */}
              {step === 3 && (
                <div className="space-y-5 animate-fade-up">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Exploitation Agricole</h3>
                      <p className="text-xs text-white/40">Informations sur votre parcelle</p>
                    </div>
                  </div>

                  <FloatingInput
                    id="farm_size"
                    label="Superficie approximative (ex: 5 hectares, optionnel)"
                    value={form.farm_size}
                    onChange={(e) => setForm(f => ({ ...f, farm_size: e.target.value }))}
                    leftSlot={<Leaf className="w-4 h-4 text-white/40" />}
                    inputClassName="bg-white/[0.04] border-white/[0.08] focus-visible:ring-amber-500/30"
                  />

                  {/* Récapitulatif */}
                  <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-3">
                    <h4 className="text-sm font-semibold text-white/70 mb-3">Récapitulatif</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[11px] text-white/30 uppercase">Nom complet</p>
                        <p className="text-amber-100 font-medium">{form.first_name} {form.last_name}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-white/30 uppercase">Email</p>
                        <p className="text-amber-100 font-medium truncate">{form.email}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-white/30 uppercase">Région</p>
                        <p className="text-amber-100 font-medium">{form.region || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-white/30 uppercase">Commune</p>
                        <p className="text-amber-100 font-medium">{form.locality || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Info Notice */}
                  <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-2xl p-5">
                    <p className="text-sm text-white/60">
                      <span className="text-amber-400 font-semibold">Note :</span> Après validation, votre mot de passe initial sera votre NIN. Vous devrez le changer à la première connexion.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/[0.06]">
                {step > 1 ? (
                  <Button
                    type="button"
                    onClick={prevStep}
                    variant="outline"
                    className="rounded-xl border-white/10 text-white/70 hover:text-white hover:bg-white/[0.05] px-6"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Précédent
                  </Button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold rounded-xl px-6 shadow-lg shadow-amber-500/25 border-0"
                  >
                    Suivant
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold rounded-xl px-8 shadow-lg shadow-amber-500/25 border-0"
                    disabled={loading}
                  >
                    {loading ? 'Envoi...' : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer la Demande
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Already have account */}
          <div className="text-center mt-8">
            <p className="text-white/40">
              Vous avez déjà un compte ?{' '}
              <Link to="/login" className="text-amber-400 hover:text-amber-300 font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
