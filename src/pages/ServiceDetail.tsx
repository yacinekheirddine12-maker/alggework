import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Clock, RotateCcw, ShieldCheck, MessageSquare, ShoppingCart, Check, Loader2, X, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatCurrency } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*, freelancer:profiles(*)')
          .eq('id', id)
          .single();

        if (error) throw error;
        setService(data);
      } catch (err) {
        console.error('Error fetching service:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchService();
  }, [id]);

  const handleOrder = () => {
    if (!user) {
      toast.error('Veuillez vous connecter pour commander.');
      navigate('/login');
      return;
    }
    setShowPaymentModal(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-slate-500">Service introuvable.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-3">
        {/* Left Column: Content */}
        <div className="lg:col-span-2 space-y-8">
          <nav className="flex text-sm text-slate-500">
            <Link to="/services" className="hover:text-emerald-600">Services</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-900">{service.category}</span>
          </nav>

          <h1 className="text-3xl font-bold text-slate-900">{service.title}</h1>

          <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
            <Link to={`/profile/${service.freelancer.id}`} className="flex items-center gap-2 hover:opacity-80">
              <img 
                src={service.freelancer.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${service.freelancer.id}`} 
                alt={service.freelancer.full_name}
                className="h-10 w-10 rounded-full bg-slate-100"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-sm font-bold text-slate-900">{service.freelancer.full_name}</p>
                <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider">
                  Freelance
                </p>
              </div>
            </Link>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-1 text-sm font-medium text-slate-900">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {service.rating_avg || 0}
              <span className="text-slate-400 font-normal">({service.review_count || 0} avis)</span>
            </div>
          </div>

          <div className="aspect-video w-full overflow-hidden rounded-2xl bg-slate-100">
            <img 
              src={service.images?.[0] || `https://picsum.photos/seed/${service.id}/800/600`} 
              alt="Service" 
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">À propos de ce service</h2>
            <div className="prose prose-slate max-w-none whitespace-pre-line text-slate-600">
              {service.description}
            </div>
          </div>

          {/* Freelancer Profile Card */}
          <div className="rounded-2xl border border-slate-200 p-6">
            <h2 className="mb-6 text-xl font-bold text-slate-900">À propos du freelance</h2>
            <div className="flex gap-6">
              <img 
                src={service.freelancer.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${service.freelancer.id}`} 
                alt={service.freelancer.full_name}
                className="h-20 w-20 rounded-full bg-slate-100"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{service.freelancer.full_name}</h3>
                  <Link to={`/profile/${service.freelancer.id}`}>
                    <Button variant="outline" size="sm">Voir Profil</Button>
                  </Link>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{service.freelancer.bio || "Aucune bio fournie."}</p>
                <div className="flex gap-4 pt-2">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 uppercase">Note</p>
                    <p className="font-bold text-slate-900">{service.freelancer.rating_avg || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400 uppercase">Avis</p>
                    <p className="font-bold text-slate-900">{service.freelancer.review_count || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Checkout */}
        <div className="space-y-6">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Standard</h3>
              <span className="text-2xl font-bold text-slate-900">{formatCurrency(service.price)}</span>
            </div>

            <p className="mb-6 text-sm text-slate-600">
              Pack complet incluant 3 concepts de logo, fichiers sources et révisions illimitées.
            </p>

            <div className="mb-8 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Clock className="h-4 w-4 text-slate-400" />
                Délai de livraison : {service.delivery_days} jours
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <RotateCcw className="h-4 w-4 text-slate-400" />
                Révisions illimitées
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Check className="h-4 w-4 text-emerald-500" />
                Fichiers sources inclus
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Check className="h-4 w-4 text-emerald-500" />
                Haute résolution
              </div>
            </div>

            <div className="space-y-3">
              <Button className="w-full" size="lg" onClick={handleOrder}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                Commander maintenant
              </Button>
              <Button variant="outline" className="w-full" size="lg">
                <MessageSquare className="mr-2 h-5 w-5" />
                Envoyer un message
              </Button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4" />
              Paiement sécurisé par AlgWork
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal 
          service={service} 
          onClose={() => setShowPaymentModal(false)} 
        />
      )}
    </div>
  );
};

const PaymentModal = ({ service, onClose }: { service: any, onClose: () => void }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Create a pending order first
      const commission = Number(service.price) * 0.1;
      const net = Number(service.price) - commission;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          client_id: user.id,
          freelancer_id: service.freelancer_id,
          service_id: service.id,
          amount: service.price,
          commission_amount: commission,
          net_amount: net,
          status: 'pending', // Pending until payment confirmation
          payment_method: 'baridimob' // Using baridimob as the identifier for Edahabia/Poste
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Initiate payment with Algérie Poste via our backend
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: `ORDER_${orderData.id}`,
          amount: service.price,
          description: `Achat service: ${service.title}`,
          profileId: user.id
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // 3. Redirect to Algérie Poste secure payment page
      toast.success('Redirection vers Algérie Poste...');
      window.location.href = data.payment_url;

    } catch (err: any) {
      console.error('Erreur paiement:', err);
      toast.error(err.message || 'Erreur lors de l\'initiation du paiement');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-900">Paiement Sécurisé Edahabia</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 text-center space-y-6">
          {loading ? (
            <div className="py-8 space-y-4">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-emerald-600" />
              <p className="font-medium text-slate-900">Redirection vers le paiement sécurisé...</p>
              <p className="text-xs text-slate-500">Veuillez ne pas fermer cette fenêtre.</p>
            </div>
          ) : (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CreditCard className="h-8 w-8 text-emerald-600" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Confirmation de commande</h3>
                <p className="text-sm text-slate-500">
                  Vous allez être redirigé vers la plateforme sécurisée d'Algérie Poste pour effectuer le paiement de :
                </p>
                <p className="text-3xl font-bold text-emerald-600">{formatCurrency(service.price)}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Service :</span>
                  <span className="font-medium text-slate-900">{service.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Freelance :</span>
                  <span className="font-medium text-slate-900">{service.freelancer?.full_name}</span>
                </div>
              </div>

              <Button 
                onClick={handlePayment} 
                className="w-full" 
                size="lg" 
                isLoading={loading}
              >
                Payer avec Edahabia
              </Button>

              <p className="text-[10px] text-slate-400">
                En cliquant sur "Payer", vous acceptez nos conditions générales de vente.
              </p>
            </>
          )}
        </div>

        <div className="bg-slate-50 px-6 py-4 text-center">
          <p className="flex items-center justify-center gap-1 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            <ShieldCheck className="h-3 w-3" />
            Paiement sécurisé par AlgWork & SATIM
          </p>
        </div>
      </div>
    </div>
  );
};
