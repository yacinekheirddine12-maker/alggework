import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Loader2, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ServiceCard } from '../components/ServiceCard';
import { Button } from '../components/ui/Button';

const CATEGORIES = ['Design', 'Programmation', 'Marketing', 'Rédaction', 'Vidéo', 'Business', 'Autre'];

export const Services = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('cat') || 'Toutes');

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('services')
          .select('*, freelancer:profiles(full_name, avatar_url)')
          .eq('is_active', true)
          .eq('is_validated', true);

        if (searchTerm) {
          query = query.ilike('title', `%${searchTerm}%`);
        }

        if (selectedCategory !== 'Toutes') {
          query = query.eq('category', selectedCategory);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        setServices(data || []);
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [searchTerm, selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: searchTerm, cat: selectedCategory });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
          Trouver un <span className="text-emerald-600">Service</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600">
          Découvrez les meilleurs talents algériens pour réaliser vos projets.
        </p>
      </div>

      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-2xl">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un service (ex: logo, site web...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-14 appearance-none rounded-2xl border border-slate-200 bg-white pl-6 pr-12 text-sm font-bold text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
            >
              <option value="Toutes">Toutes les catégories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          
          <Button variant="outline" className="h-14 rounded-2xl px-6">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filtres
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        </div>
      ) : services.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Search className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Aucun service trouvé</h3>
          <p className="mt-2 text-slate-500">Essayez de modifier vos critères de recherche ou votre catégorie.</p>
          <Button 
            variant="outline" 
            className="mt-8"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('Toutes');
            }}
          >
            Réinitialiser la recherche
          </Button>
        </div>
      )}
    </div>
  );
};
