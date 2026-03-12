import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    budget_min: number;
    budget_max: number;
    proposals_count?: number;
    created_at: string;
    category: string;
    client?: {
      full_name: string;
      avatar_url: string;
    };
  };
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <Link 
      to={`/projects/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-emerald-500 hover:shadow-lg"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
          {project.category}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Posté le {formatDate(project.created_at)}
        </span>
      </div>
      
      <h3 className="mb-3 line-clamp-1 text-lg font-bold text-slate-900 group-hover:text-emerald-600">
        {project.title}
      </h3>
      
      <p className="mb-6 line-clamp-3 flex-1 text-sm text-slate-600 leading-relaxed">
        {project.description}
      </p>
      
      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Budget</span>
          <span className="text-sm font-bold text-slate-900">
            {formatCurrency(project.budget_min)} - {formatCurrency(project.budget_max)}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Propositions</span>
          <span className="text-sm font-bold text-slate-900">
            {project.proposals_count || 0} reçues
          </span>
        </div>
      </div>
      
      {project.client && (
        <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4">
          <img 
            src={project.client.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.client.full_name}`} 
            alt={project.client.full_name}
            className="h-6 w-6 rounded-full bg-slate-100"
            referrerPolicy="no-referrer"
          />
          <span className="text-xs font-bold text-slate-900">{project.client.full_name}</span>
        </div>
      )}
    </Link>
  );
};
