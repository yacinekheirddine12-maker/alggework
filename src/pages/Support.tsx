import React from 'react';

export const FAQ = () => {
  const faqs = [
    {
      q: "Comment fonctionne le paiement ?",
      a: "Le client dépose l'argent sur AlgWork. L'argent est bloqué en sécurité et n'est libéré au freelance que lorsque le client valide le travail fini."
    },
    {
      q: "Quels sont les frais ?",
      a: "L'inscription est gratuite. Nous prélevons une commission de 10% sur les projets terminés pour couvrir les frais de service et de sécurité."
    },
    {
      q: "Comment retirer mon argent ?",
      a: "Vous pouvez retirer vos gains via BaridiMob ou virement bancaire. Les demandes sont traitées sous 24h à 48h."
    }
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-12 text-center">Aide & Support</h1>
      <div className="space-y-8">
        {faqs.map((faq, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 p-6 bg-white shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{faq.q}</h3>
            <p className="text-slate-600">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Blog = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">Blog AlgWork</h1>
      <p className="text-slate-600 mb-12">Conseils et actualités sur le freelancing en Algérie.</p>
      <div className="grid gap-8 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-left rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
            <div className="h-48 bg-slate-100"></div>
            <div className="p-6">
              <h3 className="font-bold text-slate-900 mb-2">Comment réussir en tant que freelance en 2026</h3>
              <p className="text-sm text-slate-500 mb-4">Découvrez les meilleures stratégies pour trouver vos premiers clients...</p>
              <button className="text-emerald-600 font-bold text-sm hover:underline">Lire la suite</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
