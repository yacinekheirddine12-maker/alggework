import React from 'react';

interface LegalPageProps {
  title: string;
  content: React.ReactNode;
}

export const LegalPage: React.FC<LegalPageProps> = ({ title, content }) => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-8">{title}</h1>
      <div className="prose prose-slate max-w-none">
        {content}
      </div>
    </div>
  );
};

export const Terms = () => (
  <LegalPage 
    title="Conditions Générales d'Utilisation" 
    content={
      <div className="space-y-6 text-slate-600">
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">1. Acceptation des conditions</h2>
          <p>En accédant à AlgWork, vous acceptez d'être lié par ces conditions d'utilisation, toutes les lois et réglementations applicables en Algérie.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">2. Utilisation de la plateforme</h2>
          <p>AlgWork est une plateforme de mise en relation entre freelances et clients. Nous ne sommes pas partie aux contrats conclus entre les utilisateurs.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">3. Paiements et Commissions</h2>
          <p>AlgWork prélève une commission de 10% sur chaque transaction réussie pour assurer la maintenance et la sécurité de la plateforme.</p>
        </section>
      </div>
    } 
  />
);

export const Privacy = () => (
  <LegalPage 
    title="Politique de Confidentialité" 
    content={
      <div className="space-y-6 text-slate-600">
        <p>Votre vie privée est importante pour nous. Cette politique explique comment nous collectons et utilisons vos données personnelles.</p>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Collecte des données</h2>
          <p>Nous collectons les informations que vous nous fournissez lors de la création de votre compte (nom, email, rôle).</p>
        </section>
      </div>
    } 
  />
);

export const Refund = () => (
  <LegalPage 
    title="Politique de Remboursement" 
    content={
      <div className="space-y-6 text-slate-600">
        <p>Nous nous efforçons de garantir la satisfaction de tous nos utilisateurs.</p>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Conditions de remboursement</h2>
          <p>Un remboursement peut être demandé si le travail livré ne correspond pas au cahier des charges initial ou si le freelance ne livre pas dans les délais.</p>
        </section>
      </div>
    } 
  />
);
