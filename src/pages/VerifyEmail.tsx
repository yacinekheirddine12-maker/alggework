import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (type === 'signup' && token) {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup',
          });

          if (error) throw error;
          
          setVerified(true);
          toast.success('Email vérifié avec succès !');
          
          // Rediriger vers login après 3 secondes
          setTimeout(() => {
            navigate('/login?verified=true');
          }, 3000);
        } catch (err: any) {
          setError(err.message || 'Erreur lors de la vérification');
          toast.error('Échec de la vérification');
        } finally {
          setVerifying(false);
        }
      } else {
        setVerifying(false);
        setError('Lien de vérification invalide');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  if (verifying) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
          <p className="text-slate-600">Vérification de votre email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        {verified ? (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-slate-900">
              Email vérifié !
            </h2>
            <p className="mt-2 text-slate-600">
              Votre compte a été activé avec succès. Vous allez être redirigé vers la page de connexion.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-slate-900">
              Échec de la vérification
            </h2>
            <p className="mt-2 text-slate-600">
              {error || "Le lien de vérification est invalide ou a expiré."}
            </p>
            <div className="mt-8 space-y-4">
              <Button 
                onClick={() => navigate('/signup')}
                className="w-full"
              >
                Créer un nouveau compte
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Retour à la connexion
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};