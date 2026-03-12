/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Services } from './pages/Services';
import { Projects } from './pages/Projects';
import { ServiceDetail } from './pages/ServiceDetail';
import { FreelancerDashboard } from './pages/FreelancerDashboard';
import { ClientDashboard } from './pages/ClientDashboard';
import { Wallet } from './pages/Wallet';
import { Messages } from './pages/Messages';
import { ProjectDetail } from './pages/ProjectDetail';
import { OrderTracking } from './pages/OrderTracking';
import { Profile } from './pages/Profile';
import { AuthProvider } from './contexts/AuthContext';
import { Terms, Privacy, Refund } from './pages/Legal';
import { FAQ, Blog } from './pages/Support';
import { PostProject } from './pages/PostProject';
import { Settings } from './pages/Settings';
import { VerifyEmail } from './pages/VerifyEmail';
import { CreateService } from './pages/CreateService';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PaymentFailure } from './pages/PaymentFailure';
import { isSupabaseConfigured } from './lib/supabase';
import { AlertCircle, Settings as SettingsIcon } from 'lucide-react';
import { Button } from './components/ui/Button';

const SetupRequired = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
    <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-100 text-red-600">
      <AlertCircle className="h-10 w-10" />
    </div>
    <h1 className="mb-4 text-3xl font-bold text-slate-900">Configuration Requise</h1>
    <p className="mb-8 max-w-md text-slate-600">
      Pour faire fonctionner AlgWork, vous devez configurer vos identifiants Supabase dans les <strong>Secrets</strong> d'AI Studio.
    </p>
    
    <div className="mb-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
        <SettingsIcon className="h-5 w-5 text-emerald-600" />
        Étapes de configuration :
      </h3>
      <ol className="space-y-4 text-sm text-slate-600">
        <li className="flex gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">1</span>
          <span>Ouvrez le menu <strong>Settings</strong> (icône engrenage) dans AI Studio.</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">2</span>
          <span>Allez dans l'onglet <strong>Secrets</strong>.</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">3</span>
          <div>
            <p className="mb-2">Ajoutez les deux variables suivantes (avec le préfixe <code>VITE_</code>) :</p>
            <ul className="space-y-1 font-mono text-xs">
              <li className="rounded bg-slate-100 p-1">VITE_SUPABASE_URL</li>
              <li className="rounded bg-slate-100 p-1">VITE_SUPABASE_ANON_KEY</li>
            </ul>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">4</span>
          <span>Une fois ajoutées, l'application se rafraîchira automatiquement.</span>
        </li>
      </ol>
    </div>
    
    <p className="text-xs text-slate-400">
      Note : Ces clés sont nécessaires pour gérer l'authentification et la base de données de votre marketplace.
    </p>
  </div>
);

import { AdminDashboard } from './pages/AdminDashboard';

export default function App() {
  if (!isSupabaseConfigured) {
    return <SetupRequired />;
  }

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-white font-sans text-slate-900">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/new" element={<CreateService />} />
              <Route path="/services/:id" element={<ServiceDetail />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/new" element={<PostProject />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/orders/:id" element={<OrderTracking />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/dashboard/freelancer" element={<FreelancerDashboard />} />
              <Route path="/dashboard/client" element={<ClientDashboard />} />
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/refund" element={<Refund />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/failure" element={<PaymentFailure />} />
            </Routes>
          </main>
          <Footer />
          <Toaster position="bottom-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}
