export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: 'client' | 'freelancer' | 'admin';
  skills: string[];
  portfolio_links: any;
  social_links: any;
  wallet_balance: number;
  freelancer_level: 'bronze' | 'silver' | 'gold';
  created_at: string;
};

export type Service = {
  id: string;
  freelancer_id: string;
  title: string;
  description: string;
  category: string;
  sub_category: string | null;
  price: number;
  delivery_days: number;
  images: string[];
  is_active: boolean;
  is_validated: boolean;
  rating_avg: number;
  review_count: number;
  created_at: string;
  freelancer?: Profile;
};

export type Project = {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  client?: Profile;
};

export type Order = {
  id: string;
  client_id: string;
  freelancer_id: string;
  service_id: string | null;
  project_id: string | null;
  amount: number;
  commission_amount: number;
  net_amount: number;
  status: 'pending_payment' | 'paid' | 'delivered' | 'completed' | 'disputed' | 'refunded';
  payment_method: 'paypal' | 'baridimob';
  payment_proof_url: string | null;
  created_at: string;
  updated_at: string;
};
