import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  Tag, 
  MessageSquare, 
  Send,
  User,
  ShieldCheck,
  ChevronRight,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatCurrency, formatDate } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [confirmingProposalId, setConfirmingProposalId] = useState<string | null>(null);

  const fetchProjectData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, client:profiles(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProject(data);

      // If the current user is the client, fetch proposals
      if (user && data.client_id === user.id) {
        const { data: proposalsData, error: proposalsError } = await supabase
          .from('proposals')
          .select('*, freelancer:profiles(*)')
          .eq('project_id', id)
          .order('created_at', { ascending: false });
        
        if (!proposalsError) {
          setProposals(proposalsData || []);
        }
      }

      // Fetch order if project is in progress or completed
      if (user && (data.status === 'in_progress' || data.status === 'completed')) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('project_id', id)
          .maybeSingle();
        
        if (orderData) {
          setOrder(orderData);
        }
      }
    } catch (err) {
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProjectData();
  }, [id, user]);

  const handleSendProposal = () => {
    if (!user) {
      toast.error('Vous devez être connecté pour envoyer une proposition');
      navigate('/login');
      return;
    }
    if (profile?.role !== 'freelancer') {
      toast.error('Seuls les freelances peuvent envoyer des propositions');
      return;
    }
    setShowProposalModal(true);
  };

  const handleAcceptProposal = async (proposal: any) => {
    if (!user) {
      toast.error('Vous devez être connecté pour accepter une offre');
      return;
    }
    if (user.id !== project.client_id) {
      toast.error('Seul le propriétaire du projet peut accepter une offre');
      return;
    }

    const toastId = toast.loading('Traitement de l\'acceptation...');
    setLoading(true);
    try {
      // 1. Fetch latest profile to get accurate balance
      const { data: latestProfile, error: profileError } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();

      if (profileError || !latestProfile) {
        throw new Error('Impossible de récupérer votre solde actuel');
      }

      // 2. Check client balance
      if (latestProfile.wallet_balance < proposal.bid_amount) {
        toast.error(`Solde insuffisant. Votre solde est de ${formatCurrency(latestProfile.wallet_balance)}, mais l'offre est de ${formatCurrency(proposal.bid_amount)}.`, { id: toastId });
        setLoading(false);
        setConfirmingProposalId(null);
        setTimeout(() => navigate('/wallet'), 2000);
        return;
      }

      // 3. Deduct from client balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ wallet_balance: latestProfile.wallet_balance - proposal.bid_amount })
        .eq('id', user.id);

      if (balanceError) throw new Error(`Erreur solde: ${balanceError.message}`);

      // 4. Record transaction for client
      await supabase
        .from('transactions')
        .insert([
          {
            profile_id: user.id,
            amount: -proposal.bid_amount,
            type: 'payment_sent',
            status: 'completed',
            description: `Paiement pour le projet: ${project.title}`,
          }
        ]);

      // 5. Update proposal status
      await supabase
        .from('proposals')
        .update({ status: 'accepted' })
        .eq('id', proposal.id);

      // 6. Update project status
      await supabase
        .from('projects')
        .update({ status: 'in_progress' })
        .eq('id', project.id);

      // 7. Create order
      const commission = Number(proposal.bid_amount) * 0.1;
      const net = Number(proposal.bid_amount) - commission;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          client_id: user.id,
          freelancer_id: proposal.freelancer_id,
          project_id: project.id,
          amount: proposal.bid_amount,
          commission_amount: commission,
          net_amount: net,
          status: 'paid',
          payment_method: 'baridimob'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 8. Send automatic message to freelancer
      await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          receiver_id: proposal.freelancer_id,
          content: `Félicitations ! J'ai accepté votre offre pour le projet "${project.title}". Le travail peut commencer. Vous pouvez suivre l'avancement ici : /orders/${orderData.id}`
        }]);

      toast.success('Offre acceptée ! Les fonds sont maintenant en Escrow.', { id: toastId });
      
      // Refresh data
      await fetchProjectData();
      
      // Redirect to order tracking
      setTimeout(() => navigate(`/orders/${orderData.id}`), 1500);
    } catch (err: any) {
      console.error('Full error details:', err);
      toast.error(err.message || 'Erreur lors de l\'acceptation de l\'offre', { id: toastId });
    } finally {
      setLoading(false);
      setConfirmingProposalId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-slate-500">Projet introuvable.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-3">
        {/* Left Column: Content */}
        <div className="lg:col-span-2 space-y-8">
          <nav className="flex items-center text-sm text-slate-500">
            <Link to="/projects" className="hover:text-emerald-600">Projets</Link>
            <ChevronRight className="mx-2 h-4 w-4" />
            <span className="text-slate-900">{project.category}</span>
          </nav>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                project.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 
                project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {project.status === 'open' ? 'Ouvert' : 
                 project.status === 'in_progress' ? 'En cours' : 
                 project.status === 'completed' ? 'Terminé' : 'Fermé'}
              </span>
              <span className="text-sm text-slate-400">Publié le {formatDate(project.created_at)}</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{project.title}</h1>
          </div>

          {order && (
            <div className="flex items-center justify-between rounded-2xl border-2 border-emerald-100 bg-emerald-50 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Projet en cours de réalisation</p>
                  <p className="text-sm text-slate-600">Une commande est active pour ce projet. Les fonds sont sécurisés.</p>
                </div>
              </div>
              <Link to={`/orders/${order.id}`}>
                <Button size="sm">Suivre la commande</Button>
              </Link>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-6 sm:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400 uppercase">Budget</p>
              <p className="font-bold text-slate-900">{formatCurrency(project.budget_min)} - {formatCurrency(project.budget_max)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400 uppercase">Propositions</p>
              <p className="font-bold text-slate-900">{project.proposals_count || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400 uppercase">Délai souhaité</p>
              <p className="font-bold text-slate-900">À discuter</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400 uppercase">Échéance</p>
              <p className="font-bold text-slate-900">{project.deadline ? formatDate(project.deadline) : 'Non définie'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Description du projet</h2>
            <div className="prose prose-slate max-w-none whitespace-pre-line text-slate-600">
              {project.description}
            </div>
          </div>

          {/* Proposals List for Client */}
          {user && project.client_id === user.id && (
            <div className="space-y-6 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Propositions reçues ({proposals.length})</h2>
              </div>
              
              <div className="space-y-4">
                {proposals.length > 0 ? (
                  proposals.map((proposal) => (
                    <div key={proposal.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <img 
                            src={proposal.freelancer.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${proposal.freelancer.id}`} 
                            alt={proposal.freelancer.full_name}
                            className="h-12 w-12 rounded-full bg-slate-100"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{proposal.freelancer.full_name}</p>
                            <p className="text-xs text-slate-500">Posté le {formatDate(proposal.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-400 uppercase font-bold">Offre</span>
                            <span className="font-bold text-slate-900">{formatCurrency(proposal.bid_amount)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-400 uppercase font-bold">Délai</span>
                            <span className="font-bold text-slate-900">{proposal.delivery_days} jours</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <p className="text-sm text-slate-600 line-clamp-3 italic">"{proposal.cover_letter}"</p>
                      </div>
                      
                      <div className="mt-6 flex items-center gap-3">
                        <Link to={`/messages?user=${proposal.freelancer.id}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Discuter
                          </Button>
                        </Link>
                        {project.status === 'open' && (
                          confirmingProposalId === proposal.id ? (
                            <div className="flex flex-1 gap-2">
                              <Button 
                                className="flex-1 bg-red-600 hover:bg-red-700" 
                                size="sm" 
                                onClick={() => setConfirmingProposalId(null)}
                              >
                                Annuler
                              </Button>
                              <Button 
                                className="flex-1" 
                                size="sm" 
                                onClick={() => handleAcceptProposal(proposal)}
                                isLoading={loading}
                              >
                                Confirmer
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              className="flex-1" 
                              size="sm" 
                              onClick={() => setConfirmingProposalId(proposal.id)}
                              isLoading={loading}
                            >
                              Accepter l'offre
                            </Button>
                          )
                        )}
                        {(project.status === 'in_progress' || project.status === 'completed') && proposal.status === 'accepted' && order && (
                          <Link to={`/orders/${order.id}`} className="flex-1">
                            <Button className="w-full bg-emerald-600" size="sm">
                              Suivre la commande
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
                    Aucune proposition reçue pour le moment.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Client Info & Action */}
        <div className="space-y-6">
          <div className="sticky top-24 space-y-6">
            {user && project.client_id !== user.id && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <Button className="w-full" size="lg" onClick={handleSendProposal}>
                  <Send className="mr-2 h-5 w-5" />
                  Envoyer une proposition
                </Button>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 font-bold text-slate-900">À propos du client</h3>
              <Link to={`/profile/${project.client.id}`} className="flex items-center gap-4 hover:opacity-80">
                <img 
                  src={project.client.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.client.id}`} 
                  alt={project.client.full_name}
                  className="h-12 w-12 rounded-full bg-slate-100"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="font-bold text-slate-900">{project.client.full_name}</p>
                  <p className="text-xs text-slate-500">{project.client.location || 'Algérie'}</p>
                </div>
              </Link>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Note client</span>
                  <span className="flex items-center gap-1 font-bold text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    {project.client.rating_avg || 0} ({project.client.review_count || 0} avis)
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Membre depuis</span>
                  <span className="font-bold text-slate-900">{formatDate(project.client.created_at)}</span>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <Link to={`/profile/${project.client.id}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    <User className="mr-2 h-4 w-4" />
                    Voir le profil
                  </Button>
                </Link>
                <Link to={`/messages?user=${project.client.id}`} className="w-full">
                  <Button variant="ghost" className="w-full text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contacter le client
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showProposalModal && (
        <ProposalModal 
          project={project} 
          onClose={() => setShowProposalModal(false)} 
        />
      )}
    </div>
  );
};

const ProposalModal = ({ project, onClose }: { project: any, onClose: () => void }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bidAmount: project.budget_min?.toString() || '0',
    deliveryDays: '7',
    coverLetter: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (formData.coverLetter.length < 50) {
      toast.error('Votre lettre de motivation doit faire au moins 50 caractères');
      return;
    }

    setLoading(true);
    try {
      const bid = parseFloat(formData.bidAmount);
      const days = parseInt(formData.deliveryDays);

      if (isNaN(bid) || bid <= 0) {
        toast.error('Veuillez entrer un montant valide');
        setLoading(false);
        return;
      }

      if (isNaN(days) || days <= 0) {
        toast.error('Veuillez entrer un délai valide');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('proposals')
        .insert([
          {
            project_id: project.id,
            freelancer_id: user.id,
            bid_amount: bid,
            delivery_days: days,
            cover_letter: formData.coverLetter,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      toast.success('Proposition envoyée avec succès !');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'envoi de la proposition');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-900">Envoyer une proposition</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <Input 
              label="Votre offre (DZD)" 
              type="number"
              value={formData.bidAmount}
              onChange={(e) => setFormData({...formData, bidAmount: e.target.value})}
              required
            />
            <Input 
              label="Délai de livraison (jours)" 
              type="number"
              value={formData.deliveryDays}
              onChange={(e) => setFormData({...formData, deliveryDays: e.target.value})}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Lettre de motivation</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[200px]"
              placeholder="Expliquez pourquoi vous êtes le meilleur candidat pour ce projet..."
              value={formData.coverLetter}
              onChange={(e) => setFormData({...formData, coverLetter: e.target.value})}
              required
            />
            <p className="text-[10px] text-slate-400">Minimum 50 caractères</p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" isLoading={loading}>Envoyer la proposition</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
