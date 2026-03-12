import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const PaymentFailure = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const error = searchParams.get('error') || 'La transaction a été refusée ou annulée.';

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md space-y-6 rounded-3xl border border-red-100 bg-white p-8 shadow-xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-12 w-12 text-red-600" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Paiement refusé</h1>
          <p className="text-slate-500">Veuillez vérifier votre carte ou votre solde et réessayer.</p>
        </div>

        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-left text-amber-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm font-medium">{error}</p>
        </div>

        <div className="space-y-3 pt-4">
          <Button 
            onClick={() => window.history.back()} 
            className="w-full"
            size="lg"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Réessayer le paiement
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
    </div>
  );
};
