import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  MessageSquare, 
  ShieldCheck,
  ArrowRight,
  Download,
  Upload,
  Loader2,
  DollarSign
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { toast } from 'react-hot-toast';

export const OrderTracking = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id || !user) return;
      
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            client:profiles!orders_client_id_fkey(full_name, avatar_url),
            freelancer:profiles!orders_freelancer_id_fkey(full_name, avatar_url),
            project:projects(title, description)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (err: any) {
        console.error('Error fetching order:', err);
        toast.error('Impossible de charger la commande');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Real-time updates
    const subscription = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        filter: `id=eq.${id}`
      }, (payload) => {
        setOrder((prev: any) => ({ ...prev, ...payload.new }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [id, user]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order || !user) return;
    setActionLoading(true);
    try {
      if (newStatus === 'completed') {
        // Use RPC for completion to handle funds transfer atomically
        const { error: rpcError } = await supabase.rpc('complete_order_payment', {
          order_id: order.id
        });
        if (rpcError) throw rpcError;
        toast.success('Commande terminée et fonds libérés !');
      } else {
        const updateData: any = { 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        };

        if (newStatus === 'delivered' && deliveryNote) {
          updateData.delivery_note = deliveryNote;
        }

        const { error } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', order.id);

        if (error) throw error;
        toast.success(`Statut mis à jour : ${newStatus}`);
      }
    } catch (err: any) {
      console.error('Error updating order status:', err);
      toast.error(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Commande non trouvée</h2>
        <Link to="/dashboard/client" className="mt-4 inline-block text-emerald-600 hover:underline">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const isClient = user?.id === order.client_id;
  const isFreelancer = user?.id === order.freelancer_id;

  const steps = [
    { id: 'paid', label: 'Paiement en Escrow', desc: 'Le client a payé, les fonds sont sécurisés par AlgWork.' },
    { id: 'delivered', label: 'Travail Livré', desc: 'Le freelance a envoyé les fichiers finaux.' },
    { id: 'completed', label: 'Fonds Libérés', desc: 'Le client a validé, le freelance est payé.' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === order.status);
  
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Link to={isClient ? "/dashboard/client" : "/dashboard/freelancer"} className="hover:text-emerald-600">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <span>Commande #{order.id.slice(0, 8)}</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900">Suivi de commande</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/messages?user=${isClient ? order.freelancer_id : order.client_id}`}>
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              Ouvrir le Chat
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Status & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Tracker */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="mb-8 font-bold text-slate-900">Étapes de sécurisation</h3>
            <div className="relative space-y-8">
              {steps.map((step, idx) => {
                const isPast = steps.findIndex(s => s.id === order.status) >= idx;
                const isCurrent = order.status === step.id;
                
                return (
                  <div key={step.id} className="flex gap-4">
                    <div className="relative flex flex-col items-center">
                      <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                        isPast ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-white text-slate-300'
                      }`}>
                        {isPast ? <CheckCircle2 className="h-5 w-5" /> : <span>{idx + 1}</span>}
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={`absolute top-8 h-full w-0.5 ${
                          steps.findIndex(s => s.id === order.status) > idx ? 'bg-emerald-500' : 'bg-slate-100'
                        }`} />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className={`font-bold ${isPast ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                      <p className="text-sm text-slate-500">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Box */}
          <div className="rounded-2xl border-2 border-emerald-100 bg-emerald-50 p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">Système Anti-Arnaque AlgWork</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {order.status === 'paid' && isFreelancer && "Le client a payé. Vous pouvez commencer à travailler en toute sécurité. Une fois terminé, cliquez sur 'Livrer le travail'."}
                  {order.status === 'paid' && isClient && "Vos fonds sont en sécurité. Le freelance travaille sur votre projet. Attendez la livraison pour libérer le paiement."}
                  {order.status === 'delivered' && isClient && "Le freelance a livré le travail ! Vérifiez les fichiers. Si tout est correct, cliquez sur 'Valider et Payer'."}
                  {order.status === 'delivered' && isFreelancer && "Travail livré ! En attente de la validation du client pour recevoir vos fonds."}
                  {order.status === 'completed' && "Cette commande est terminée. Les fonds ont été transférés au freelance."}
                </p>
                
                <div className="mt-6 flex flex-col gap-4">
                  {order.status === 'paid' && isFreelancer && (
                    <div className="space-y-4">
                      <textarea
                        className="w-full rounded-xl border border-slate-200 p-4 text-sm focus:border-emerald-500 focus:outline-none"
                        placeholder="Ajoutez un message de livraison (ex: lien vers les fichiers, instructions...)"
                        rows={3}
                        value={deliveryNote}
                        onChange={(e) => setDeliveryNote(e.target.value)}
                      />
                      <Button onClick={() => handleUpdateStatus('delivered')} isLoading={actionLoading} disabled={!deliveryNote}>
                        <Upload className="mr-2 h-4 w-4" />
                        Livrer le travail final
                      </Button>
                    </div>
                  )}
                  
                  {order.status === 'delivered' && order.delivery_note && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Message de livraison :</p>
                      <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{order.delivery_note}</p>
                    </div>
                  )}

                  {order.status === 'delivered' && isClient && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-100/50 p-4 text-sm text-emerald-800">
                        <p className="font-bold">Le travail a été livré !</p>
                        <p>Vérifiez les fichiers fournis par le freelance. Si tout est conforme, cliquez sur le bouton ci-dessous pour libérer les fonds de l'Escrow vers le portefeuille du freelance.</p>
                      </div>
                      <Button onClick={() => handleUpdateStatus('completed')} isLoading={actionLoading} className="w-full">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Valider la livraison et Payer le freelance
                      </Button>
                    </div>
                  )}

                  {order.status === 'completed' && (
                    <div className="flex items-center gap-2 font-bold text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                      Terminé avec succès
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Details */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-bold text-slate-900">Détails du projet</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Projet</p>
                <Link to={`/projects/${order.project_id}`} className="font-bold text-slate-900 hover:text-emerald-600">
                  {order.project?.title}
                </Link>
                <p className="mt-2 text-sm text-slate-500 line-clamp-3">{order.project?.description}</p>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-4">
                <span className="text-sm text-slate-500">Montant total</span>
                <span className="font-bold text-slate-900">{formatCurrency(order.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Statut</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-bold text-slate-900">Parties prenantes</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 overflow-hidden">
                  <img src={order.client?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${order.client?.full_name}`} alt="Client" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Client</p>
                  <p className="text-sm font-bold text-slate-900">{order.client?.full_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 overflow-hidden">
                  <img src={order.freelancer?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${order.freelancer?.full_name}`} alt="Freelancer" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Freelance</p>
                  <p className="text-sm font-bold text-slate-900">{order.freelancer?.full_name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
  </svg>
);
