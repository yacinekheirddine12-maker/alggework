import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, Star, Headphones, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Home = () => {
  const categories = [
    { name: 'Design & Graphisme', icon: '🎨', count: '1.2k+ services' },
    { name: 'Programmation & Tech', icon: '💻', count: '850+ services' },
    { name: 'Marketing Digital', icon: '📈', count: '600+ services' },
    { name: 'Rédaction & Traduction', icon: '✍️', count: '450+ services' },
    { name: 'Vidéo & Animation', icon: '🎬', count: '300+ services' },
    { name: 'Musique & Audio', icon: '🎵', count: '200+ services' },
  ];

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section */}
      <section className="relative bg-slate-900 py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500 via-transparent to-transparent blur-3xl"></div>
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl mb-6">
            Trouvez les meilleurs talents <span className="text-emerald-500">freelances</span> en Algérie
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-300 mb-10">
            La plateforme de confiance pour recruter des experts locaux. Design, programmation, marketing et bien plus encore.
          </p>
          
          <div className="mx-auto max-w-3xl flex flex-col sm:flex-row gap-4 items-center justify-center">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Quel service recherchez-vous ?"
                className="h-14 w-full rounded-xl border-none bg-white pl-12 pr-4 text-slate-900 shadow-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <Button size="lg" className="h-14 px-8 w-full sm:w-auto">
              Rechercher
            </Button>
          </div>
          
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            <span>Populaire :</span>
            <Link to="/services?q=logo" className="hover:text-white transition-colors">Logo Design</Link>
            <Link to="/services?q=wordpress" className="hover:text-white transition-colors">WordPress</Link>
            <Link to="/services?q=seo" className="hover:text-white transition-colors">SEO</Link>
            <Link to="/services?q=mobile" className="hover:text-white transition-colors">App Mobile</Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Shield className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Paiement Sécurisé</h3>
            <p className="text-slate-600">
              Votre argent est en sécurité. Nous ne payons le freelance qu'une fois le travail validé par vous.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Star className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Qualité Garantie</h3>
            <p className="text-slate-600">
              Consultez les portfolios et les avis clients pour choisir le meilleur expert pour votre projet.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Headphones className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Support Local</h3>
            <p className="text-slate-600">
              Une équipe dédiée pour vous accompagner et gérer les paiements via BaridiMob et PayPal.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Parcourir par Catégorie</h2>
            <p className="text-slate-600">Trouvez l'expertise dont vous avez besoin parmi nos catégories.</p>
          </div>
          <Link to="/services" className="hidden sm:flex items-center gap-2 text-emerald-600 font-semibold hover:gap-3 transition-all">
            Voir tout <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => (
            <Link 
              key={cat.name}
              to={`/services?cat=${cat.name}`}
              className="group flex flex-col items-center p-6 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-lg transition-all"
            >
              <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">{cat.icon}</span>
              <h4 className="text-sm font-bold text-slate-900 text-center mb-1">{cat.name}</h4>
              <span className="text-xs text-slate-500">{cat.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-emerald-600 px-6 py-16 sm:px-12 sm:py-20">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 opacity-20">
            <div className="h-96 w-96 rounded-full bg-white blur-3xl"></div>
          </div>
          
          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="max-w-2xl text-center lg:text-left">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
                Prêt à lancer votre projet ?
              </h2>
              <p className="text-lg text-emerald-50 mb-8">
                Rejoignez des milliers de clients et freelances algériens sur la plateforme de référence.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <Link to="/signup">
                  <Button variant="secondary" size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50">
                    Commencer maintenant
                  </Button>
                </Link>
                <Link to="/projects/new">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                    Publier un Job
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              {[
                'Inscription gratuite',
                'Accès aux meilleurs talents',
                'Paiements sécurisés',
                'Support 24/7'
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-white font-medium">
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
