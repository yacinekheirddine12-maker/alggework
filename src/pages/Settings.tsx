import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'react-hot-toast';
import { User, Shield, Bell, CreditCard, Loader2 } from 'lucide-react';

export const Settings = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'payments'>('profile');
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState(profile?.notification_preferences || {
    orders: true,
    messages: true,
    updates: true,
    offers: false
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          bio: bio,
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profil mis à jour !');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      toast.success('Mot de passe mis à jour !');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleUpdateNotifs = async (prefs: any) => {
    if (!user) return;
    setNotifPrefs(prefs);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: prefs
        })
        .eq('id', user.id);
      if (error) throw error;
      toast.success('Préférences enregistrées');
    } catch (err) {
      console.error(err);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Informations Publiques</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <Input 
                  label="Nom Complet" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                />
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Bio</label>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[120px]"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Parlez-nous de vous..."
                  />
                </div>

                <Button type="submit" isLoading={loading}>Enregistrer les modifications</Button>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Compte</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">Adresse Email</p>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('security')}>Changer le mot de passe</Button>
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Sécurité du compte</h2>
              <form className="space-y-6" onSubmit={handleUpdatePassword}>
                <Input 
                  label="Nouveau mot de passe" 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <Input 
                  label="Confirmer le nouveau mot de passe" 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button type="submit" isLoading={updatingPassword}>Mettre à jour le mot de passe</Button>
              </form>
            </div>
            <div className="rounded-2xl border border-red-100 bg-red-50 p-8 shadow-sm">
              <h2 className="text-xl font-bold text-red-900 mb-4">Zone de danger</h2>
              <p className="text-sm text-red-700 mb-6">Une fois votre compte supprimé, toutes vos données seront définitivement effacées.</p>
              <Button 
                variant="outline" 
                className="border-red-200 text-red-600 hover:bg-red-100"
                onClick={() => {
                  if (window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
                    toast.error('Pour des raisons de sécurité, veuillez contacter le support pour supprimer votre compte.');
                  }
                }}
              >
                Supprimer mon compte
              </Button>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Préférences de notification</h2>
            <div className="space-y-6">
              {[
                { id: 'orders', title: 'Nouvelles commandes', desc: 'Recevoir une notification lorsqu\'un client passe une commande.' },
                { id: 'messages', title: 'Messages directs', desc: 'Être prévenu quand vous recevez un nouveau message.' },
                { id: 'updates', title: 'Mises à jour de projets', desc: 'Notifications sur l\'avancement de vos projets en cours.' },
                { id: 'offers', title: 'Offres promotionnelles', desc: 'Recevoir des conseils et des offres de la part d\'AlgWork.' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                  <button 
                    onClick={() => handleUpdateNotifs({ ...notifPrefs, [item.id]: !notifPrefs[item.id] })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      notifPrefs[item.id] ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifPrefs[item.id] ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'payments':
        return (
          <div className="space-y-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Méthodes de paiement</h2>
              <div className="space-y-4">
                <PaymentMethodFlow />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Historique des transactions</h2>
              <div className="text-center py-12">
                <p className="text-slate-500">Aucune transaction récente.</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Paramètres</h1>
      
      <div className="grid gap-8 md:grid-cols-4">
        <aside className="space-y-1">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === 'profile' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User className="h-4 w-4" />
            Profil
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === 'security' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Shield className="h-4 w-4" />
            Sécurité
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === 'notifications' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bell className="h-4 w-4" />
            Notifications
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === 'payments' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Paiements
          </button>
        </aside>

        <div className="md:col-span-3">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const PaymentMethodFlow = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<'list' | 'add' | 'otp'>('list');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    name: '',
    cvv: ''
  });
  const [otp, setOtp] = useState('');
  const [savedCards, setSavedCards] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchSavedCards();
    }
  }, [user]);

  const fetchSavedCards = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedCards(data || []);
    } catch (err) {
      console.error('Error fetching cards:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardData.number.length !== 16) {
      toast.error('Le numéro de carte doit comporter 16 chiffres');
      return;
    }
    if (!cardData.number.startsWith('6280')) {
      toast.error('Seules les cartes Edahabia (commençant par 6280) sont acceptées pour BaridiMob.');
      return;
    }
    setLoading(true);
    // Simulate sending SMS
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      toast.success('Un code de confirmation a été envoyé par SMS au numéro lié à votre carte Edahabia.');
    }, 1500);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (otp.length !== 6) {
      toast.error('Le code de confirmation doit comporter 6 chiffres');
      return;
    }
    setLoading(true);
    
    try {
      // Real database insertion
      const { data, error } = await supabase
        .from('payment_methods')
        .insert([
          {
            user_id: user.id,
            last_four: cardData.number.slice(-4),
            cardholder_name: cardData.name,
            expiry_date: cardData.expiry,
            provider: 'Edahabia'
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSavedCards([data, ...savedCards]);
      setStep('list');
      setCardData({ number: '', expiry: '', name: '', cvv: '' });
      setOtp('');
      toast.success('Carte Edahabia enregistrée dans votre compte !');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'enregistrement de la carte');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSavedCards(savedCards.filter(c => c.id !== id));
      toast.success('Carte supprimée');
    } catch (err: any) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (step === 'list') {
    return (
      <div className="space-y-4">
        {savedCards.length > 0 ? (
          <div className="space-y-3">
            {savedCards.map((card) => (
              <div key={card.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-white shadow-sm">
                  <CreditCard className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">Carte Edahabia (**** {card.last_four})</p>
                  <p className="text-sm text-slate-500">{card.cardholder_name} • Expire: {card.expiry_date}</p>
                </div>
                <button 
                  onClick={() => handleDeleteCard(card.id)}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
            <p className="text-slate-500 text-sm mb-4">Aucune méthode de paiement enregistrée.</p>
          </div>
        )}
        <Button variant="outline" className="w-full" onClick={() => setStep('add')}>
          Ajouter une carte Edahabia (BaridiMob)
        </Button>
      </div>
    );
  }

  if (step === 'add') {
    return (
      <form onSubmit={handleAddCard} className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <button type="button" onClick={() => setStep('list')} className="text-sm text-slate-500 hover:text-slate-900">← Retour</button>
          <h3 className="font-bold text-slate-900">Ajouter une carte Edahabia</h3>
        </div>
        
        <Input 
          label="Numéro de la carte (16 chiffres)" 
          maxLength={16}
          value={cardData.number}
          onChange={(e) => setCardData({...cardData, number: e.target.value.replace(/\D/g, '')})}
          placeholder="0000 0000 0000 0000"
          required
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Date d'expiration (MM/AA)" 
            placeholder="MM/AA"
            value={cardData.expiry}
            onChange={(e) => {
              let val = e.target.value.replace(/\D/g, '');
              if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
              setCardData({...cardData, expiry: val});
            }}
            maxLength={5}
            required
          />
          <Input 
            label="Code CVV2/CVC2 (3 chiffres)" 
            type="password"
            maxLength={3}
            value={cardData.cvv}
            onChange={(e) => setCardData({...cardData, cvv: e.target.value.replace(/\D/g, '')})}
            placeholder="123"
            required
          />
        </div>
        
        <Input 
          label="Nom du titulaire" 
          value={cardData.name}
          onChange={(e) => setCardData({...cardData, name: e.target.value.toUpperCase()})}
          placeholder="NOM PRÉNOM"
          required
        />

        <div className="pt-4">
          <Button type="submit" className="w-full" isLoading={loading}>
            Continuer vers la vérification SMS
          </Button>
        </div>
      </form>
    );
  }

  if (step === 'otp') {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="font-bold text-slate-900 text-lg">Vérification SMS</h3>
          <p className="text-sm text-slate-500">
            Veuillez saisir le code de confirmation reçu par SMS pour valider l'ajout de votre carte.
          </p>
        </div>

        <Input 
          label="Code de confirmation (6 chiffres)" 
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          className="text-center text-2xl tracking-[1em]"
          required
        />

        <div className="space-y-3">
          <Button type="submit" className="w-full" isLoading={loading}>
            Confirmer et ajouter la carte
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('add')}>
            Retour aux informations de la carte
          </Button>
        </div>
      </form>
    );
  }

  return null;
};
