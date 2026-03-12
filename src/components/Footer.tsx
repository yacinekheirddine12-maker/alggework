import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
                AW
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                AlgWork
              </span>
            </div>
            <p className="text-sm text-slate-500">
              La première marketplace freelance en Algérie. Connectez-vous avec les meilleurs talents locaux.
            </p>
          </div>
          
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">Catégories</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link to="/services?cat=Design" className="hover:text-emerald-600">Design & Graphisme</Link></li>
              <li><Link to="/services?cat=Programmation" className="hover:text-emerald-600">Programmation & Tech</Link></li>
              <li><Link to="/services?cat=Marketing" className="hover:text-emerald-600">Marketing Digital</Link></li>
              <li><Link to="/services?cat=Rédaction" className="hover:text-emerald-600">Rédaction & Traduction</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">Communauté</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link to="/signup?role=freelancer" className="hover:text-emerald-600">Devenir Freelance</Link></li>
              <li><Link to="/projects/new" className="hover:text-emerald-600">Publier un Projet</Link></li>
              <li><Link to="/faq" className="hover:text-emerald-600">Aide & Support</Link></li>
              <li><Link to="/blog" className="hover:text-emerald-600">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">Légal</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link to="/terms" className="hover:text-emerald-600">Conditions Générales</Link></li>
              <li><Link to="/privacy" className="hover:text-emerald-600">Confidentialité</Link></li>
              <li><Link to="/refund" className="hover:text-emerald-600">Remboursement</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 border-t border-slate-100 pt-8 text-center text-sm text-slate-400">
          <p>© {new Date().getFullYear()} AlgWork. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};
