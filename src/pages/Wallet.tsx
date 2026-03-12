import React, { useEffect, useState } from 'react';
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  X,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatCurrency, formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export const Wallet = () => {
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [transRes, methodsRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('payment_methods')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (transRes.error) throw transRes.error;
      if (methodsRes.error) throw methodsRes.error;

      setTransactions(transRes.data || []);
      setPaymentMethods(methodsRes.data || []);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Balance & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <WalletIcon className="h-6 w-6 text-emerald-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Solde Disponible</span>
            </div>
            <div className="mt-8">
              <h2 className="text-4xl font-bold">{formatCurrency(profile?.wallet_balance || 0)}</h2>
              <p className="mt-2 text-sm text-slate-400">
                En attente : <span className="font-bold text-white">{formatCurrency(0)}</span>
              </p>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4">
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={() => setShowWithdrawModal(true)}>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Retirer
              </Button>
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10" onClick={() => setShowTopUpModal(true)}>
                <ArrowDownLeft className="mr-2 h-4 w-4" />
                Déposer
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 font-bold text-slate-900">Méthodes de Retrait</h3>
            <div className="space-y-3">
              {paymentMethods.length > 0 ? (
                paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{method.provider}</p>
                        <p className="text-xs text-slate-500">**** {method.last_four}</p>
                      </div>
                    </div>
                    <Link to="/settings" className="text-xs font-bold text-emerald-600 hover:underline">Gérer</Link>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-100 p-4 text-center">
                  <p className="text-xs text-slate-500">Aucune méthode enregistrée</p>
                </div>
              )}
            </div>
            <Link to="/settings">
              <Button variant="ghost" className="mt-4 w-full text-xs font-bold">Ajouter une méthode</Button>
            </Link>
          </div>
        </div>

        {/* Right: Transaction History */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="flex items-center gap-2 font-bold text-slate-900">
                <History className="h-5 w-5 text-slate-400" />
                Historique des Transactions
              </h3>
              <Button variant="ghost" size="sm">Tout voir</Button>
            </div>
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : transactions.length > 0 ? (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        tx.type === 'withdrawal' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {tx.type === 'withdrawal' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{tx.description}</p>
                        <p className="text-xs text-slate-500">{formatDate(tx.date)} • {tx.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        tx.type === 'withdrawal' ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </p>
                      <div className="flex items-center justify-end gap-1">
                        {tx.status === 'completed' ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Clock className="h-3 w-3 text-amber-500" />
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          tx.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {tx.status === 'completed' ? 'Terminé' : 'En attente'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-slate-500">
                  Aucune transaction pour le moment.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-800">
            <AlertCircle className="h-5 w-5 shrink-0 text-blue-600" />
            <div className="text-sm">
              <p className="font-bold">Information sur les retraits</p>
              <p className="mt-1 text-blue-700">
                Les retraits BaridiMob sont traités manuellement par nos administrateurs sous 24h à 48h. 
                Une commission de 10% est déjà déduite de vos revenus lors de la validation de la commande.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showTopUpModal && (
        <TopUpModal 
          onClose={() => setShowTopUpModal(false)} 
          onSuccess={() => {
            fetchData();
            // Force a refresh of the page to update the profile in AuthContext
            window.location.reload();
          }}
        />
      )}

      {showWithdrawModal && (
        <WithdrawModal 
          onClose={() => setShowWithdrawModal(false)} 
          onSuccess={() => {
            fetchData();
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

const WithdrawModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess?: () => void }) => {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'amount' | 'success'>('amount');

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast.error('Montant invalide');
      return;
    }

    if (withdrawAmount > profile.wallet_balance) {
      toast.error('Solde insuffisant');
      return;
    }

    setLoading(true);
    try {
      // Record transaction as pending withdrawal
      // The balance will be updated automatically by the database trigger when marked as 'completed' by admin
      const { error: transError } = await supabase
        .from('transactions')
        .insert([
          {
            profile_id: user.id,
            amount: -withdrawAmount,
            type: 'withdrawal',
            status: 'pending',
            description: 'Demande de retrait BaridiMob',
          }
        ]);

      if (transError) throw transError;

      setStep('success');
      toast.success('Demande de retrait envoyée !');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error withdrawing:', err);
      toast.error(err.message || 'Erreur lors du retrait');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-900">Retirer des fonds</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 'amount' ? (
            <form onSubmit={handleWithdraw} className="space-y-6">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Solde disponible</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(profile?.wallet_balance || 0)}</p>
              </div>

              <Input 
                label="Montant à retirer (DZD)" 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 2000"
                required
              />

              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
                <p className="font-bold">Note :</p>
                <p>Les retraits sont traités manuellement via BaridiMob sous 24h à 48h.</p>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                Confirmer le retrait
              </Button>
            </form>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Demande Envoyée !</h3>
                <p className="text-sm text-slate-500">
                  Votre demande de retrait de {formatCurrency(Number(amount))} a été enregistrée et sera traitée prochainement.
                </p>
              </div>
              <Button onClick={onClose} className="w-full">
                Fermer
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TopUpModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess?: () => void }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < 100) {
      toast.error('Le montant minimum est de 100 DZD');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: `DEPOSIT_${user.id}`,
          amount: depositAmount,
          description: `Rechargement de compte AlgWork`,
          profileId: user.id
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      toast.success('Redirection vers Algérie Poste...');
      window.location.href = data.payment_url;

    } catch (err: any) {
      console.error('Erreur rechargement:', err);
      toast.error(err.message || 'Erreur lors de l\'initiation du dépôt');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-900">Recharger mon compte</h3>
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
                <h3 className="text-xl font-bold text-slate-900">Dépôt par Carte Edahabia</h3>
                <p className="text-sm text-slate-500">
                  Saisissez le montant que vous souhaitez ajouter à votre portefeuille AlgWork.
                </p>
              </div>

              <form onSubmit={handleTopUp} className="space-y-6">
                <Input 
                  label="Montant à déposer (DZD)" 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ex: 5000"
                  required
                  min="100"
                />
                <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                  Continuer vers Algérie Poste
                </Button>
              </form>

              <p className="text-[10px] text-slate-400">
                Les fonds seront disponibles sur votre compte dès confirmation du paiement par Algérie Poste.
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
