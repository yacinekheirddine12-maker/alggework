import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  Calendar, 
  MessageSquare, 
  Share2, 
  ExternalLink,
  Award,
  CheckCircle2,
  Loader2,
  Settings as SettingsIcon
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ServiceCard } from '../components/ServiceCard';
import { formatDate } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('freelancer_id', id)
          .eq('is_active', true);

        if (servicesError) throw servicesError;
        setServices(servicesData || []);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProfileData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-slate-500">Profil introuvable.</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === id;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-3">
        {/* Left Column: Profile Info */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="relative mx-auto h-32 w-32">
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name}
                className="h-full w-full rounded-full bg-slate-100 border-4 border-white shadow-md"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-1 right-1 h-6 w-6 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            
            <h1 className="mt-6 text-2xl font-bold text-slate-900">{profile.full_name}</h1>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">
              {profile.role === 'freelancer' ? `Freelance` : 'Client'}
            </p>

            <div className="mt-6 flex items-center justify-center gap-1 text-sm font-bold text-slate-900">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {profile.rating_avg || 0}
              <span className="text-slate-400 font-normal">({profile.review_count || 0} avis)</span>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {isOwnProfile ? (
                <Link to="/settings" className="col-span-2">
                  <Button variant="outline" className="w-full">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Paramètres
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to={`/messages?user=${id}`} className="w-full">
                    <Button className="w-full">Contacter</Button>
                  </Link>
                  <Button variant="outline" className="w-full">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-bold text-slate-900">Informations</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400" />
                {profile.location || 'Algérie'}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                Membre depuis {formatDate(profile.created_at)}
              </div>
            </div>
          </div>

          {profile.skills && profile.skills.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-bold text-slate-900">Compétences</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill: string) => (
                  <span key={skill} className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Portfolio & Services */}
        <div className="lg:col-span-2 space-y-10">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">À propos</h2>
            <p className="text-slate-600 leading-relaxed">{profile.bio || "Aucune description fournie."}</p>
          </div>

          {profile.portfolio && profile.portfolio.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Portfolio</h2>
                <Link to="#" className="text-sm font-bold text-emerald-600 hover:underline">Voir tout</Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {profile.portfolio.map((item: any) => (
                  <div key={item.id} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="text-sm font-bold text-white">{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {services.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Mes Services</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
};
