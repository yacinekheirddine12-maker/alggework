import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    price: number;
    rating_avg?: number;
    review_count?: number;
    delivery_days: number;
    images?: string[];
    freelancer?: {
      full_name: string;
      avatar_url: string;
    };
  };
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  return (
    <Link 
      to={`/services/${service.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:border-emerald-500 hover:shadow-lg"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img 
          src={service.images?.[0] || `https://picsum.photos/seed/${service.id}/400/300`} 
          alt={service.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
      </div>
      
      <div className="flex flex-1 flex-col p-4">
        {service.freelancer && (
          <div className="mb-3 flex items-center gap-2">
            <img 
              src={service.freelancer.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${service.freelancer.full_name}`} 
              alt={service.freelancer.full_name}
              className="h-6 w-6 rounded-full bg-slate-100"
              referrerPolicy="no-referrer"
            />
            <span className="text-xs font-bold text-slate-900">{service.freelancer.full_name}</span>
          </div>
        )}
        
        <h3 className="mb-2 line-clamp-2 flex-1 text-sm font-bold text-slate-900 group-hover:text-emerald-600">
          {service.title}
        </h3>
        
        <div className="mb-4 flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1 font-bold text-slate-900">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {service.rating_avg || 0}
            <span className="font-normal text-slate-400">({service.review_count || 0})</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {service.delivery_days}j
          </div>
        </div>
        
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">À partir de</span>
          <span className="text-lg font-bold text-emerald-600">{formatCurrency(service.price)}</span>
        </div>
      </div>
    </Link>
  );
};
