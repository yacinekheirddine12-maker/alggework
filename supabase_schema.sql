-- SQL Schema for AlgWork Marketplace

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles Table (Shared by all users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT CHECK (role IN ('client', 'freelancer', 'admin')) DEFAULT 'client',
  skills TEXT[], -- Array of skills
  portfolio_links JSONB, -- Links to portfolio items
  social_links JSONB,
  wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
  freelancer_level TEXT CHECK (freelancer_level IN ('bronze', 'silver', 'gold')) DEFAULT 'bronze',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Services (Gigs) Table
CREATE TABLE services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  price DECIMAL(12, 2) NOT NULL,
  delivery_days INTEGER NOT NULL,
  images TEXT[], -- Array of image URLs
  is_active BOOLEAN DEFAULT true,
  is_validated BOOLEAN DEFAULT false,
  rating_avg DECIMAL(3, 2) DEFAULT 0.00,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Projects (Jobs posted by clients)
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  budget_min DECIMAL(12, 2),
  budget_max DECIMAL(12, 2),
  deadline TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Project Proposals
CREATE TABLE proposals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  cover_letter TEXT NOT NULL,
  bid_amount DECIMAL(12, 2) NOT NULL,
  delivery_days INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Orders (Transactions)
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES profiles(id) NOT NULL,
  freelancer_id UUID REFERENCES profiles(id) NOT NULL,
  service_id UUID REFERENCES services(id), -- Optional if it's a project-based order
  project_id UUID REFERENCES projects(id), -- Optional if it's a service-based order
  amount DECIMAL(12, 2) NOT NULL,
  commission_amount DECIMAL(12, 2) NOT NULL, -- 10%
  net_amount DECIMAL(12, 2) NOT NULL, -- 90%
  status TEXT CHECK (status IN ('pending_payment', 'paid', 'delivered', 'completed', 'disputed', 'refunded')) DEFAULT 'pending_payment',
  payment_method TEXT CHECK (payment_method IN ('paypal', 'baridimob')) NOT NULL,
  payment_proof_url TEXT, -- For BaridiMob manual confirmation
  delivery_note TEXT, -- Message from freelancer when delivering
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Wallet Transactions (History)
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT CHECK (type IN ('deposit', 'withdrawal', 'payment_received', 'payment_sent', 'refund')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Messages (Chat)
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Reviews
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- FUNCTIONS & TRIGGERS

-- 1. Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Update wallet balance on transaction completion
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed')) THEN
    UPDATE public.profiles
    SET wallet_balance = wallet_balance + NEW.amount
    WHERE id = NEW.profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_transaction_completed
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();

-- 3. RPC to complete order and transfer funds
CREATE OR REPLACE FUNCTION public.complete_order_payment(order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Get order details
  SELECT * INTO v_order FROM public.orders WHERE id = order_id AND status = 'delivered';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or not in delivered status';
  END IF;

  -- Update order status
  UPDATE public.orders SET status = 'completed', updated_at = NOW() WHERE id = order_id;

  -- Create transaction for freelancer
  INSERT INTO public.transactions (profile_id, amount, type, status, description)
  VALUES (v_order.freelancer_id, v_order.net_amount, 'payment_received', 'completed', 'Paiement reçu pour la commande #' || v_order.id);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC to accept project proposal atomically
CREATE OR REPLACE FUNCTION public.accept_proposal(
  p_proposal_id UUID,
  p_client_id UUID,
  p_payment_method TEXT
)
RETURNS UUID AS $$
DECLARE
  v_proposal RECORD;
  v_project RECORD;
  v_client_balance DECIMAL;
  v_order_id UUID;
  v_commission DECIMAL;
  v_net DECIMAL;
BEGIN
  -- 1. Get proposal and project details
  SELECT * INTO v_proposal FROM public.proposals WHERE id = p_proposal_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Proposition non trouvée'; END IF;
  
  SELECT * INTO v_project FROM public.projects WHERE id = v_proposal.project_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Projet non trouvé'; END IF;
  
  -- 2. Verify client ownership and project status
  IF v_project.client_id != p_client_id THEN RAISE EXCEPTION 'Vous n''êtes pas le propriétaire de ce projet'; END IF;
  IF v_project.status != 'open' THEN RAISE EXCEPTION 'Ce projet n''est plus ouvert aux propositions'; END IF;
  
  -- 3. Check client balance
  SELECT wallet_balance INTO v_client_balance FROM public.profiles WHERE id = p_client_id;
  IF v_client_balance < v_proposal.bid_amount THEN RAISE EXCEPTION 'Solde insuffisant'; END IF;
  
  -- 4. Deduct from client balance
  UPDATE public.profiles SET wallet_balance = wallet_balance - v_proposal.bid_amount WHERE id = p_client_id;
  
  -- 5. Record transaction for client
  INSERT INTO public.transactions (profile_id, amount, type, status, description)
  VALUES (p_client_id, -v_proposal.bid_amount, 'payment_sent', 'completed', 'Paiement pour le projet: ' || v_project.title);
  
  -- 6. Update proposal status
  UPDATE public.proposals SET status = 'accepted' WHERE id = p_proposal_id;
  
  -- 7. Update project status
  UPDATE public.projects SET status = 'in_progress' WHERE id = v_proposal.project_id;
  
  -- 8. Create order
  v_commission := v_proposal.bid_amount * 0.1;
  v_net := v_proposal.bid_amount - v_commission;
  
  INSERT INTO public.orders (
    client_id, 
    freelancer_id, 
    project_id, 
    amount, 
    commission_amount, 
    net_amount, 
    status, 
    payment_method
  )
  VALUES (
    p_client_id, 
    v_proposal.freelancer_id, 
    v_proposal.project_id, 
    v_proposal.bid_amount, 
    v_commission, 
    v_net, 
    'paid', 
    p_payment_method
  )
  RETURNING id INTO v_order_id;
  
  -- 9. Send automatic message to freelancer
  INSERT INTO public.messages (sender_id, receiver_id, content)
  VALUES (
    p_client_id, 
    v_proposal.freelancer_id, 
    'Félicitations ! J''ai accepté votre offre pour le projet "' || v_project.title || '". Le travail peut commencer. Vous pouvez suivre l''avancement ici : /orders/' || v_order_id
  );
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC to order service atomically
CREATE OR REPLACE FUNCTION public.order_service(
  p_service_id UUID,
  p_client_id UUID,
  p_payment_method TEXT
)
RETURNS UUID AS $$
DECLARE
  v_service RECORD;
  v_order_id UUID;
  v_commission DECIMAL;
  v_net DECIMAL;
BEGIN
  -- 1. Get service details
  SELECT * INTO v_service FROM public.services WHERE id = p_service_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Service non trouvé'; END IF;
  
  -- 2. Calculate amounts
  v_commission := v_service.price * 0.1;
  v_net := v_service.price - v_commission;
  
  -- 3. Create order
  INSERT INTO public.orders (
    client_id, 
    freelancer_id, 
    service_id, 
    amount, 
    commission_amount, 
    net_amount, 
    status, 
    payment_method
  )
  VALUES (
    p_client_id, 
    v_service.freelancer_id, 
    v_service.id, 
    v_service.price, 
    v_commission, 
    v_net, 
    'paid', 
    p_payment_method
  )
  RETURNING id INTO v_order_id;
  
  -- 4. Record transactions (simulation of payment)
  INSERT INTO public.transactions (profile_id, amount, type, status, description)
  VALUES (p_client_id, v_service.price, 'deposit', 'completed', 'Dépôt pour achat service: ' || v_service.title);
  
  INSERT INTO public.transactions (profile_id, amount, type, status, description)
  VALUES (p_client_id, -v_service.price, 'payment_sent', 'completed', 'Paiement service: ' || v_service.title);
  
  -- 5. Send automatic message to freelancer
  INSERT INTO public.messages (sender_id, receiver_id, content)
  VALUES (
    p_client_id, 
    v_service.freelancer_id, 
    'Bonjour ! Je viens de commander votre service "' || v_service.title || '". J''ai hâte de voir le résultat. Vous pouvez suivre la commande ici : /orders/' || v_order_id
  );
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC to resolve dispute by admin
CREATE OR REPLACE FUNCTION public.resolve_dispute(
  p_order_id UUID,
  p_freelancer_payout DECIMAL,
  p_client_refund DECIMAL
)
RETURNS VOID AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- 1. Get order details
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Commande non trouvée'; END IF;
  
  -- 2. Update order status
  UPDATE public.orders 
  SET status = 'completed', 
      net_amount = p_freelancer_payout,
      updated_at = NOW() 
  WHERE id = p_order_id;
  
  -- 3. Pay freelancer the agreed amount
  IF p_freelancer_payout > 0 THEN
    INSERT INTO public.transactions (profile_id, amount, type, status, description)
    VALUES (v_order.freelancer_id, p_freelancer_payout, 'payment_received', 'completed', 'Paiement partiel après résolution de litige pour la commande #' || v_order.id);
  END IF;
  
  -- 4. Refund client the remaining amount
  IF p_client_refund > 0 THEN
    INSERT INTO public.transactions (profile_id, amount, type, status, description)
    VALUES (v_order.client_id, p_client_refund, 'refund', 'completed', 'Remboursement partiel après résolution de litige pour la commande #' || v_order.id);
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
