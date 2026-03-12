import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const projectSchema = z.object({
  title: z.string().min(5, 'Le titre doit faire au moins 5 caractères'),
  description: z.string().min(20, 'La description doit faire au moins 20 caractères'),
  category: z.string().min(1, 'Veuillez choisir une catégorie'),
  budgetMin: z.coerce.number().min(0, 'Le budget minimum est de 0 DZD'),
  budgetMax: z.coerce.number().min(0, 'Le budget maximum doit être supérieur ou égal au minimum'),
}).refine((data) => data.budgetMax >= data.budgetMin, {
  message: "Le budget maximum doit être supérieur ou égal au budget minimum",
  path: ["budgetMax"],
});

type ProjectForm = z.infer<typeof projectSchema>;

const CATEGORIES = ['Design', 'Programmation', 'Marketing', 'Rédaction', 'Vidéo', 'Business', 'Autre'];

export const PostProject = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      category: 'Design',
      budgetMin: 0,
      budgetMax: 1000
    }
  });

  const onSubmit = async (data: ProjectForm) => {
    if (!user) {
      toast.error('Vous devez être connecté pour publier un projet');
      navigate('/login');
      return;
    }

    try {
      // 1. Vérifier si le profil existe
      console.log('Vérification du profil pour user:', user.id);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = pas de résultat
        console.error('Erreur vérification profil:', profileError);
        throw new Error('Erreur lors de la vérification de votre profil');
      }

      // 2. Si le profil n'existe pas, le créer
      if (!profile) {
        console.log('Profil non trouvé, création...');
        
        // Récupérer les métadonnées de l'utilisateur
        const fullName = user.user_metadata?.full_name || 
                        user.email?.split('@')[0] || 
                        'Utilisateur';
        const role = user.user_metadata?.role || 'client';

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              full_name: fullName,
              role: role,
              wallet_balance: 0,
              freelancer_level: 'bronze',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          ]);

        if (insertError) {
          console.error('Erreur création profil:', insertError);
          throw new Error('Impossible de créer votre profil. Veuillez réessayer.');
        }
        
        console.log('Profil créé avec succès');
      }

      // 3. Maintenant on peut insérer le projet
      console.log('Insertion du projet...', {
        client_id: user.id,
        title: data.title,
        description: data.description,
        budget_min: data.budgetMin,
        budget_max: data.budgetMax,
        status: 'open',
        category: data.category,
      });

      const { error: projectError, data: projectData } = await supabase
        .from('projects')
        .insert([
          {
            client_id: user.id,
            title: data.title,
            description: data.description,
            budget_min: data.budgetMin,
            budget_max: data.budgetMax,
            status: 'open',
            category: data.category,
          },
        ])
        .select();

      if (projectError) {
        console.error('Erreur insertion projet:', projectError);
        throw projectError;
      }

      console.log('Projet créé avec succès:', projectData);
      toast.success('Projet publié avec succès !');
      navigate('/projects');
      
    } catch (error: any) {
      console.error('Erreur complète:', error);
      
      // Messages d'erreur plus spécifiques
      if (error.message?.includes('foreign key constraint')) {
        toast.error('Erreur de configuration de votre compte. Veuillez contacter le support.');
      } else if (error.message?.includes('duplicate key')) {
        toast.error('Un projet avec ces informations existe déjà.');
      } else {
        toast.error(error.message || 'Erreur lors de la publication');
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Publier un Projet</h1>
        <p className="mt-2 text-slate-600">Décrivez votre besoin et recevez des propositions de freelances algériens.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="space-y-4">
            <Input
              label="Titre du projet"
              placeholder="Ex: Création d'un logo pour une pâtisserie"
              {...register('title')}
              error={errors.title?.message}
            />
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Catégorie</label>
              <select
                className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                {...register('category')}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Description détaillée</label>
              <textarea
                className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[150px]"
                placeholder="Décrivez précisément ce que vous attendez..."
                {...register('description')}
              />
              {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Budget Min (DZD)"
                type="number"
                placeholder="0"
                {...register('budgetMin')}
                error={errors.budgetMin?.message}
              />
              <Input
                label="Budget Max (DZD)"
                type="number"
                placeholder="1000"
                {...register('budgetMax')}
                error={errors.budgetMax?.message}
              />
            </div>

            <div className="rounded-lg bg-blue-50 p-4 text-xs text-blue-700">
              <p className="font-medium">ℹ️ Information :</p>
              <p>Votre projet sera visible par tous les freelances de la catégorie choisie.</p>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Publication en cours...' : 'Publier le projet'}
          </Button>
        </form>
      </div>
    </div>
  );
};
