import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const serviceSchema = z.object({
  title: z.string().min(5, 'Le titre doit faire au moins 5 caractères'),
  description: z.string().min(20, 'La description doit faire au moins 20 caractères'),
  category: z.string().min(1, 'Veuillez choisir une catégorie'),
  price: z.coerce.number().min(500, 'Le prix minimum est de 500 DZD'),
  deliveryDays: z.coerce.number().min(1, 'Le délai minimum est de 1 jour'),
});

type ServiceForm = z.infer<typeof serviceSchema>;

const CATEGORIES = ['Design', 'Programmation', 'Marketing', 'Rédaction', 'Vidéo', 'Business', 'Autre'];

export const CreateService = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      category: 'Design',
      price: 1000,
      deliveryDays: 3
    }
  });

  const onSubmit = async (data: ServiceForm) => {
    if (!user) {
      toast.error('Vous devez être connecté pour créer un service');
      navigate('/login');
      return;
    }

    if (profile?.role !== 'freelancer') {
      toast.error('Seuls les freelances peuvent créer des services');
      return;
    }

    try {
      const { error } = await supabase
        .from('services')
        .insert([
          {
            freelancer_id: user.id,
            title: data.title,
            description: data.description,
            category: data.category,
            price: data.price,
            delivery_days: data.deliveryDays,
            is_active: true,
            is_validated: false, // Needs admin validation usually
          },
        ]);

      if (error) throw error;

      toast.success('Service créé avec succès ! Il sera visible après validation.');
      navigate('/dashboard/freelancer');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création du service');
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Créer un Service</h1>
        <p className="mt-2 text-slate-600">Proposez vos compétences et commencez à gagner de l'argent.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="space-y-4">
            <Input
              label="Titre du service"
              placeholder="Ex: Je vais créer votre logo professionnel"
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
              <label className="text-sm font-medium text-slate-700">Description du service</label>
              <textarea
                className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[150px]"
                placeholder="Détaillez ce que vous proposez dans ce service..."
                {...register('description')}
              />
              {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prix (DZD)"
                type="number"
                placeholder="1000"
                {...register('price')}
                error={errors.price?.message}
              />
              <Input
                label="Délai de livraison (jours)"
                type="number"
                placeholder="3"
                {...register('deliveryDays')}
                error={errors.deliveryDays?.message}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            isLoading={isSubmitting}
          >
            Créer le service
          </Button>
        </form>
      </div>
    </div>
  );
};
