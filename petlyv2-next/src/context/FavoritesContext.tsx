'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiGetFavoriteCaregivers, apiAddFavoriteCaregiver, apiRemoveFavoriteCaregiver, isAuthenticated, getUser } from '@/utils/api';

interface FavoritesContextType {
  favorites: string[];
  isLoading: boolean;
  isFavorite: (caregiverId: string) => boolean;
  toggleFavorite: (caregiverId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshFavorites = useCallback(async () => {
    if (!isAuthenticated()) {
      setFavorites([]);
      return;
    }

    const user = getUser();
    if (user?.role !== 'tutor') {
      setFavorites([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiGetFavoriteCaregivers();
      // data is a list of caregiver objects, we only need IDs
      setFavorites(data.map((c: any) => c._id || c.id));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const isFavorite = (caregiverId: string) => {
    return favorites.includes(caregiverId);
  };

  const toggleFavorite = async (caregiverId: string) => {
    if (!isAuthenticated()) {
      // In a real app, maybe redirect to login or show modal
      window.location.href = '/login';
      return;
    }

    const currentlyFavorite = isFavorite(caregiverId);

    try {
      if (currentlyFavorite) {
        // Optimistic update
        setFavorites(prev => prev.filter(id => id !== caregiverId));
        await apiRemoveFavoriteCaregiver(caregiverId);
      } else {
        // Optimistic update
        setFavorites(prev => [...prev, caregiverId]);
        await apiAddFavoriteCaregiver(caregiverId);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update if error
      refreshFavorites();
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isLoading, isFavorite, toggleFavorite, refreshFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
