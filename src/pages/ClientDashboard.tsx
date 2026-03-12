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
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';

export const ClientDashboard = () => {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch client's projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*, proposals_count:proposals(count)')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;
        setProjects(projectsData || []);

        // Fetch client's active orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*, freelancer:profiles(full_name, avatar_url), project:projects(title)')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(ordersData || []);
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
  const openProjects = projects.filter(p => p.status === 'open');
  const inProgressProjects = projects.filter(p => p.status === 'in_progress');

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tableau de bord Client</h1>
          <p className="mt-1 text-slate-500">Bienvenue, {profile?.full_name}. Gérez vos jobs et commandes.</p>
        </div>
        <Link to="/projects/new">
          <Button className="h-12 rounded-xl px-6">
            <Plus className="mr-2 h-5 w-5" />
            Publier un Job
          </Button>
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Stats Cards */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-500">Jobs ouverts</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{openProjects.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Clock className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-500">Missions en cours</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{inProgressProjects.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-500">Dépenses totales</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(orders.reduce((acc, o) => acc + Number(o.amount), 0))}</p>
            </div>
          </div>

          {/* In Progress Projects Section */}
          {inProgressProjects.length > 0 && (
            <div className="rounded-2xl border-2 border-emerald-100 bg-emerald-50 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-emerald-100 px-6 py-4">
                <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Jobs en cours de réalisation
                </h3>
              </div>
              <div className="divide-y divide-emerald-100">
                {inProgressProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between px-6 py-4 hover:bg-emerald-100/50">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{project.title}</p>
                      <p className="text-xs text-slate-500">
                        Statut: <span className="text-emerald-600 font-bold">En cours</span> • {formatDate(project.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Link to={`/projects/${project.id}`}>
                        <Button size="sm" className="h-9 rounded-lg">
                          Gérer le Job
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Orders Section */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-bold text-slate-900">Suivi des paiements (Escrow)</h3>
              <Link to="/orders" className="text-xs font-bold text-emerald-600 hover:underline">Tout voir</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {activeOrders.length > 0 ? (
                activeOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <img 
                        src={order.freelancer?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${order.freelancer?.full_name}`} 
                        alt="Freelancer" 
                        className="h-10 w-10 rounded-full bg-slate-100"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{order.project?.title || 'Service'}</p>
                        <p className="text-xs text-slate-500">Freelance: {order.freelancer?.full_name} • {formatCurrency(order.amount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        order.status === 'paid' ? 'bg-blue-100 text-blue-700' : 
                        order.status === 'delivered' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {order.status === 'paid' ? 'Sécurisé' : 
                         order.status === 'delivered' ? 'À valider' : order.status}
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
                  Aucune transaction en cours.
                </div>
              )}
            </div>
          </div>

          {/* My Projects Section */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-bold text-slate-900">Mes Annonces de Jobs</h3>
              <Link to="/projects" className="text-xs font-bold text-emerald-600 hover:underline">Tout voir</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {openProjects.length > 0 ? (
                openProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{project.title}</p>
                      <p className="text-xs text-slate-500">
                        {project.proposals_count?.[0]?.count || 0} propositions reçues • {formatDate(project.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                        Ouvert
                      </span>
                      <Link to={`/projects/${project.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-slate-500 text-sm">
                  Vous n'avez pas de projets ouverts.
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
                <p className="text-xs text-slate-500">Client AlgWork</p>
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
