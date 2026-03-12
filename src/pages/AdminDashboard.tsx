import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  DollarSign, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalCommissions: 0,
    totalVolume: 0,
    userCount: 0,
    projectCount: 0,
    orderCount: 0
  });
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [pendingServices, setPendingServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resolvingOrderId, setResolvingOrderId] = useState<string | null>(null);
  const [payoutRatio, setPayoutRatio] = useState<number>(50); // Default 50% payout

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        // Fetch Orders
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*, client:profiles!orders_client_id_fkey(full_name), freelancer:profiles!orders_freelancer_id_fkey(full_name)')
          .order('created_at', { ascending: false });
        
        if (ordersError) throw ordersError;
        setAllOrders(orders || []);

        const totalCommissions = orders?.reduce((acc, o) => acc + Number(o.commission_amount || 0), 0) || 0;
        const totalVolume = orders?.reduce((acc, o) => acc + Number(o.amount || 0), 0) || 0;

        // Fetch Pending Withdrawals
        const { data: withdrawals, error: withdrawalsError } = await supabase
          .from('transactions')
          .select('*, profile:profiles(full_name)')
          .eq('type', 'withdrawal')
          .eq('status', 'pending');
        
        if (withdrawalsError) throw withdrawalsError;
        setPendingWithdrawals(withdrawals || []);

        // Fetch Pending Services
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('*, freelancer:profiles(full_name)')
          .eq('is_validated', false);
        
        if (servicesError) throw servicesError;
        setPendingServices(services || []);

        // Fetch User Count
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch Project Count
        const { count: projectCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalCommissions,
          totalVolume,
          userCount: userCount || 0,
          projectCount: projectCount || 0,
          orderCount: orders?.length || 0
        });

      } catch (err) {
        console.error('Error fetching admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleResolveDispute = async (order: any) => {
    setActionLoading(order.id);
    try {
      const freelancerPayout = (Number(order.amount) * (payoutRatio / 100)) * 0.9; // 90% of the ratio (10% commission)
      const clientRefund = Number(order.amount) * ((100 - payoutRatio) / 100);
      
      const { error } = await supabase.rpc('resolve_dispute', {
        p_order_id: order.id,
        p_freelancer_payout: freelancerPayout,
        p_client_refund: clientRefund
      });

      if (error) throw error;
      
      toast.success(`Litige résolu : ${payoutRatio}% au freelance, ${100 - payoutRatio}% au client.`);
      setResolvingOrderId(null);
      
      // Refresh data
      const { data: updatedOrders } = await supabase
        .from('orders')
        .select('*, client:profiles!orders_client_id_fkey(full_name), freelancer:profiles!orders_freelancer_id_fkey(full_name)')
        .order('created_at', { ascending: false });
      setAllOrders(updatedOrders || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erreur lors de la résolution');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveWithdrawal = async (id: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;
      setPendingWithdrawals(prev => prev.filter(w => w.id !== id));
      toast.success('Retrait marqué comme payé');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erreur lors de la validation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveService = async (id: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_validated: true })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state immediately
      setPendingServices(prev => prev.filter(s => s.id !== id));
      toast.success('Service validé avec succès');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erreur lors de la validation du service');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Tableau de bord Administrateur</h1>
        <p className="mt-1 text-slate-500">Vue d'ensemble de la plateforme AlgWork et de vos revenus.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-500">Vos Gains (Commissions)</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalCommissions)}</p>
          <p className="text-xs text-slate-400 mt-2">Basé sur 10% de commission</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-500">Volume de Transactions</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(stats.totalVolume)}</p>
          <p className="text-xs text-slate-400 mt-2">{stats.orderCount} commandes totales</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-500">Utilisateurs Inscrits</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.userCount}</p>
          <p className="text-xs text-slate-400 mt-2">Freelances et Clients</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Briefcase className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-500">Jobs Publiés</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.projectCount}</p>
          <p className="text-xs text-slate-400 mt-2">Toutes catégories confondues</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Orders */}
        <div className="lg:col-span-2 space-y-8">
          {/* Pending Withdrawals */}
          {pendingWithdrawals.length > 0 && (
            <div className="rounded-2xl border-2 border-amber-100 bg-amber-50/30 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-amber-100 px-6 py-4 bg-amber-50">
                <h3 className="font-bold text-amber-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Demandes de Retrait en Attente
                </h3>
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">
                  {pendingWithdrawals.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-amber-50/50 text-xs font-bold uppercase text-amber-600">
                    <tr>
                      <th className="px-6 py-3">Utilisateur</th>
                      <th className="px-6 py-3">Montant</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {pendingWithdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-amber-50/50">
                        <td className="px-6 py-4 font-bold text-slate-900">{w.profile?.full_name}</td>
                        <td className="px-6 py-4 font-bold text-red-600">{formatCurrency(Math.abs(w.amount))}</td>
                        <td className="px-6 py-4 text-slate-500">{formatDate(w.created_at)}</td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleApproveWithdrawal(w.id)}
                            isLoading={actionLoading === w.id}
                          >
                            Marquer comme payé
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pending Services */}
          {pendingServices.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-slate-400" />
                  Services en Attente de Validation
                </h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                  {pendingServices.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400">
                    <tr>
                      <th className="px-6 py-3">Service</th>
                      <th className="px-6 py-3">Freelance</th>
                      <th className="px-6 py-3">Prix</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingServices.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{s.title}</span>
                            <span className="text-xs text-slate-400">{s.category}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{s.freelancer?.full_name}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(s.price)}</td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            size="sm" 
                            onClick={() => handleApproveService(s.id)}
                            isLoading={actionLoading === s.id}
                          >
                            Valider
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-bold text-slate-900">Gestion des Commandes & Litiges</h3>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-400">{allOrders.length} commandes</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-3">Commande</th>
                    <th className="px-6 py-3">Client / Freelance</th>
                    <th className="px-6 py-3">Montant</th>
                    <th className="px-6 py-3">Statut</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-bold">#{order.id.slice(0, 8)}</span>
                          <span className="text-[10px] text-slate-400">{formatDate(order.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{order.client?.full_name}</span>
                          <span className="text-xs text-slate-400">→ {order.freelancer?.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(order.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                          order.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'delivered' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {order.status !== 'completed' && order.status !== 'cancelled' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 text-[10px] border-amber-200 text-amber-700 hover:bg-amber-50"
                              onClick={() => setResolvingOrderId(resolvingOrderId === order.id ? null : order.id)}
                            >
                              Résoudre Litige
                            </Button>
                          )}
                          <Link to={`/orders/${order.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                        
                        {resolvingOrderId === order.id && (
                          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-left border border-slate-200 animate-in fade-in slide-in-from-top-2">
                            <p className="text-xs font-bold text-slate-900 mb-3">Régler le litige (Division du prix)</p>
                            <div className="space-y-4">
                              <div>
                                <div className="flex justify-between text-[10px] mb-1">
                                  <span>Freelance: {payoutRatio}%</span>
                                  <span>Client: {100 - payoutRatio}%</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="100" 
                                  step="10"
                                  value={payoutRatio}
                                  onChange={(e) => setPayoutRatio(parseInt(e.target.value))}
                                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  className="flex-1 h-8 text-[10px]"
                                  onClick={() => handleResolveDispute(order)}
                                  isLoading={actionLoading === order.id}
                                >
                                  Confirmer la résolution
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 text-[10px]"
                                  onClick={() => setResolvingOrderId(null)}
                                >
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {allOrders.length === 0 && (
              <div className="py-10 text-center text-slate-500">
                Aucune commande enregistrée.
              </div>
            )}
          </div>
        </div>

        {/* Admin Actions */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-bold text-slate-900">Actions Rapides</h3>
            <div className="space-y-3">
              <Link to="/projects" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Gérer les Jobs
                </Button>
              </Link>
              <Link to="/services" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Search className="mr-2 h-4 w-4" />
                  Gérer les Services
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Gérer les utilisateurs
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-emerald-100 bg-emerald-50 p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-bold text-emerald-900">Sécurité Escrow</h3>
                <p className="mt-1 text-xs text-emerald-700 leading-relaxed">
                  Toutes les transactions passent par le système Escrow d'AlgWork. 
                  Les fonds sont bloqués jusqu'à la validation du client, garantissant la sécurité pour les deux parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
