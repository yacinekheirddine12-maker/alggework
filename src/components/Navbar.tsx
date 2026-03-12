import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Menu, Bell, Wallet, MessageSquare, LogOut } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../contexts/AuthContext';

export const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
              AW
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              AlgWork
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/services" className="text-sm font-medium text-slate-600 hover:text-emerald-600">
              Services
            </Link>
            <Link to="/projects" className="text-sm font-medium text-slate-600 hover:text-emerald-600">
              Trouver un Job
            </Link>
            {user && profile?.role === 'client' && (
              <Link to="/dashboard/client" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                Mes Projets
              </Link>
            )}
            {user && profile?.role === 'freelancer' && (
              <Link to="/dashboard/freelancer" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                Mon Dashboard
              </Link>
            )}
            {user && (
              <Link to="/wallet" className="text-sm font-medium text-slate-600 hover:text-emerald-600">
                Portefeuille
              </Link>
            )}
            {user && user.email === 'algobrosia@gmail.com' && (
              <Link to="/dashboard/admin" className="text-sm font-bold text-emerald-600 hover:text-emerald-700">
                Admin
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="h-9 w-64 rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/messages" className="relative p-2 text-slate-600 hover:text-emerald-600">
                  <MessageSquare className="h-5 w-5" />
                </Link>
                <Link to="/wallet" className="p-2 text-slate-600 hover:text-emerald-600">
                  <Wallet className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-3">
                  <Link to={profile?.role === 'freelancer' ? '/dashboard/freelancer' : '/dashboard/client'}>
                    <div className="h-8 w-8 rounded-full bg-emerald-100 p-0.5 border border-emerald-200 overflow-hidden">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name || user.email}`} 
                        alt="Avatar" 
                        className="h-full w-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="p-2 text-slate-600 hover:text-red-600 transition-colors"
                    title="Déconnexion"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Connexion</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">S'inscrire</Button>
                </Link>
              </>
            )}
            <button className="md:hidden p-2 text-slate-600">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
