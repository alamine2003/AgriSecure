import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, Leaf, MapPin, Mail, Phone, User, Hash, Home } from 'lucide-react';
import { Button } from '../components/ui/button';
import { FloatingInput } from '../components/ui/floating-input';
import { PhoneInputSenegal } from '../components/ui/phone-input-senegal';
import { LocationSelector } from '../components/ui/location-selector';
import { notify } from '../lib/notify';
import client from '../api/client';

export default function RegisterAgent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await client.post('/surveillance/registration-requests/', form);
      notify.success(
        'Demande envoyée',
        'Votre demande d\'inscription a été envoyée avec succès. Un maintenancier va la traiter dans les plus brefs délais.'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AgriWatch</h1>
              <p className="text-xs text-gray-600">Surveillance Agricole Intelligente</p>
            </div>
          </Link>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg">
              <UserPlus className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Demande d'Inscription
            </h1>
            <p className="text-lg text-gray-600">
              Remplissez ce formulaire pour demander un compte agent agricole. Un maintenancier examinera votre demande.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations Personnelles */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-green-600" />
                  Informations Personnelles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FloatingInput
                    id="nin"
                    label="NIN (Numéro d'Identification National)"
                    value={form.nin}
                    onChange={(e) => setForm(f => ({ ...f, nin: e.target.value }))}
                    required
                    icon={<Hash className="w-4 h-4" />}
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
                    icon={<Mail className="w-4 h-4" />}
                  />
                  <FloatingInput
                    id="first_name"
                    label="Prénom"
                    value={form.first_name}
                    onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))}
                    required
                  />
                  <FloatingInput
                    id="last_name"
                    label="Nom"
                    value={form.last_name}
                    onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))}
                    required
                  />
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Téléphone *
                    </label>
                    <PhoneInputSenegal
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Localisation */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-green-600" />
                  Localisation de l'Exploitation
                </h3>

                <LocationSelector
                  onLocationSelect={handleLocationSelect}
                  initialRegion={form.region}
                  initialCommune={form.locality}
                  showGPS={false}
                />

                <div className="mt-4">
                  <FloatingInput
                    id="address"
                    label="Adresse complète"
                    value={form.address}
                    onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                    required
                    icon={<Home className="w-4 h-4" />}
                  />
                </div>
              </div>

              {/* Exploitation */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Leaf className="w-5 h-5 mr-2 text-green-600" />
                  Exploitation Agricole
                </h3>
                <FloatingInput
                  id="farm_size"
                  label="Superficie approximative (ex: 5 hectares, optionnel)"
                  value={form.farm_size}
                  onChange={(e) => setForm(f => ({ ...f, farm_size: e.target.value }))}
                />
              </div>

              {/* Info Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Après validation de votre demande par un maintenancier, vous recevrez vos identifiants par email.
                  Votre mot de passe initial sera votre NIN. Vous devrez le changer lors de votre première connexion.
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg py-6"
                disabled={loading}
              >
                {loading ? 'Envoi en cours...' : 'Envoyer la Demande'}
              </Button>
            </form>
          </div>

          {/* Already have account */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Vous avez déjà un compte?{' '}
              <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
