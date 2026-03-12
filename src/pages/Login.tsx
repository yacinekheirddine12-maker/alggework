import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Github } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Bon retour !');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xl mb-4">
            AW
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Bon retour !</h2>
          <p className="mt-2 text-sm text-slate-600">
            Connectez-vous à votre compte AlgWork
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 mb-1">
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                  placeholder="votre@email.com"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                Se souvenir de moi
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" title="Mot de passe oublié ?" className="font-medium text-emerald-600 hover:text-emerald-500">
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          <Button type="submit" className="w-full py-6 text-lg" isLoading={loading}>
            Se connecter
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-slate-500">Ou continuer avec</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <Button variant="outline" className="w-full py-6">
              <Github className="mr-2 h-5 w-5" />
              GitHub
            </Button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-600">
          Pas encore de compte ?{' '}
          <Link to="/signup" className="font-bold text-emerald-600 hover:text-emerald-500">
            S'inscrire gratuitement
          </Link>
        </p>
      </div>
    </div>
  );
};
