import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../lib/utils';

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const orderId = searchParams.get('order_id');
  const amount = searchParams.get('amount');
  const isMock = searchParams.get('mock') === 'true';

  useEffect(() => {
    // Simulate a small delay to ensure backend has processed the webhook
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 text-center">
      {loading ? (
        <div className="space-y-4">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-emerald-600" />
          <h2 className="text-xl font-bold text-slate-900">Validation de votre paiement...</h2>
          <p className="text-slate-500 text-sm">Nous confirmons la transaction avec Algérie Poste.</p>
        </div>
      ) : (
        <div className="max-w-md space-y-6 rounded-3xl border border-slate-100 bg-white p-8 shadow-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Paiement confirmé</h1>
            {isMock && (
              <div className="mx-auto inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Mode Démo / Simulation
              </div>
            )}
            <p className="text-slate-500">Votre commande est validée et le travail peut commencer.</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Référence :</span>
              <span className="font-mono font-medium text-slate-900">{orderId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Montant payé :</span>
              <span className="font-bold text-emerald-600">{formatCurrency(Number(amount) || 0)}</span>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button 
              onClick={() => navigate(orderId?.startsWith('ORDER_') ? `/orders/${orderId.replace('ORDER_', '')}` : '/wallet')} 
              className="w-full"
              size="lg"
            >
              Voir les détails
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              Retour à l'accueil
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
