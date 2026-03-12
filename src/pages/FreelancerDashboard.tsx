import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  ArrowRight, 
  Loader2, 
  Briefcase,
  DollarSign,
  Star,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';

export const FreelancerDashboard = () => {
  const { user, profile } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch freelancer's services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('freelancer_id', user.id)
          .order('created_at', { ascending: false });

        if (servicesError) throw servicesError;
        setServices(servicesData || []);

        // Fetch freelancer's active orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*, client:profiles(full_name, avatar_url), project:projects(title)')
          .eq('freelancer_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(ordersData || []);

        // Fetch freelancer's proposals
        const { data: proposalsData, error: proposalsError } = await supabase
          .from('proposals')
          .select('*, project:projects(title, status)')
          .eq('freelancer_id', user.id)
          .order('created_at', { ascending: false });

        if (proposalsError) throw proposalsError;
        setProposals(proposalsData || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const pendingProposals = proposals.filter(p => p.status === 'pending');

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tableau de bord Freelance</h1>
          <p className="mt-1 text-slate-500">Bienvenue, {profile?.full_name}. Gérez vos services et vos missions.</p>
        </div>
        <div className="flex gap-4">
          <Link to="/services/new">
            <Button variant="outline" className="h-12 rounded-xl px-6">
              <Plus className="mr-2 h-5 w-5" />
              Créer un service
            </Button>
          </Link>
          <Link to="/projects">
            <Button className="h-12 rounded-xl px-6">
              Trouver un Job
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Stats Cards */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-500">Revenus totaux</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(orders.filter(o => o.status === 'completed').reduce((acc, o) => acc + Number(o.amount), 0))}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Clock className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-500">Missions en cours</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{activeOrders.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Star className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-500">Note moyenne</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{profile?.rating_avg || '0.0'}</p>
            </div>
          </div>

          {/* Active Missions Section */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-bold text-slate-900">Missions actives</h3>
              <Link to="/orders" className="text-xs font-bold text-emerald-600 hover:underline">Tout voir</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {activeOrders.length > 0 ? (
                activeOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <img 
                        src={order.client?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${order.client?.full_name}`} 
                        alt="Client" 
                        className="h-10 w-10 rounded-full bg-slate-100"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{order.project?.title || 'Service'}</p>
                        <p className="text-xs text-slate-500">Client: {order.client?.full_name} • {formatCurrency(order.amount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        order.status === 'paid' ? 'bg-blue-100 text-blue-700' : 
                        order.status === 'delivered' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {order.status === 'paid' ? 'En cours' : 
                         order.status === 'delivered' ? 'Livré' : order.status}
                      </span>
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-slate-500 text-sm">
                  Aucune mission active.
                </div>
              )}
            </div>
          </div>

          {/* My Proposals Section */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-bold text-slate-900">Mes Propositions</h3>
              <Link to="/proposals" className="text-xs font-bold text-emerald-600 hover:underline">Tout voir</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {proposals.length > 0 ? (
                proposals.map((proposal) => (
                  <div key={proposal.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{proposal.project?.title}</p>
                      <p className="text-xs text-slate-500">
                        {formatCurrency(proposal.amount)} • {formatDate(proposal.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        proposal.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                        proposal.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {proposal.status === 'pending' ? 'En attente' : 
                         proposal.status === 'accepted' ? 'Acceptée' : 
                         proposal.status === 'rejected' ? 'Refusée' : proposal.status}
                      </span>
                      <Link to={`/projects/${proposal.project_id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-slate-500 text-sm">
                  Vous n'avez pas encore envoyé de proposition.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Profile & Quick Actions */}
        <div className="space-y-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <img 
                src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name}`} 
                alt="Profile" 
                className="h-14 w-14 rounded-full bg-slate-100"
              />
              <div>
                <p className="font-bold text-slate-900">{profile?.full_name}</p>
                <p className="text-xs text-slate-500">Freelance AlgWork</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Solde portefeuille</span>
                <span className="font-bold text-slate-900">{formatCurrency(profile?.wallet_balance || 0)}</span>
              </div>
              <Link to="/wallet">
                <Button variant="outline" className="w-full mt-4" size="sm">
                  Gérer mon portefeuille
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Mes Services</h3>
            <div className="space-y-4">
              {services.length > 0 ? (
                services.slice(0, 3).map(service => (
                  <Link key={service.id} to={`/services/${service.id}`} className="block group">
                    <p className="text-sm font-medium text-slate-700 group-hover:text-emerald-600 line-clamp-1">{service.title}</p>
                    <p className="text-xs text-slate-400">{formatCurrency(service.price)}</p>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-slate-500">Aucun service créé.</p>
              )}
              <Link to="/profile" className="block pt-2 text-xs font-bold text-emerald-600 hover:underline">
                Gérer mes services
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Besoin d'aide ?</h3>
            <div className="space-y-4">
              <Link to="/faq" className="flex items-center gap-3 text-sm text-slate-600 hover:text-emerald-600">
                <AlertCircle className="h-4 w-4" />
                Foire aux questions
              </Link>
              <Link to="/messages" className="flex items-center gap-3 text-sm text-slate-600 hover:text-emerald-600">
                <MessageSquare className="h-4 w-4" />
                Support client
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
