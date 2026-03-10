'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface DataCategories {
  location: number;
  identity: number;
  contacts: number;
  browsing: number;
  media: number;
}

interface ShadowEvent {
  id: string;
  timestamp: Date;
  type: 'add' | 'remove';
  category: keyof DataCategories;
  amount: number;
  source: string;
}

interface ShadowContextType {
  shadowSize: number;
  dataCategories: DataCategories;
  history: ShadowEvent[];
  addData: (category: keyof DataCategories, amount: number, source: string) => void;
  removeData: (category: keyof DataCategories, amount: number, source: string) => void;
  resetShadow: () => void;
  getSeverity: () => 'low' | 'medium' | 'high';
}

const ShadowContext = createContext<ShadowContextType | undefined>(undefined);

const INITIAL_CATEGORIES: DataCategories = {
  location: 15,
  identity: 10,
  contacts: 5,
  browsing: 20,
  media: 10,
};

export function ShadowProvider({ children }: { children: ReactNode }) {
  const [dataCategories, setDataCategories] = useState<DataCategories>(INITIAL_CATEGORIES);
  const [history, setHistory] = useState<ShadowEvent[]>([]);

  // Calculate shadow size (0-100)
  const shadowSize = Math.min(
    100,
    (dataCategories.location +
     dataCategories.identity +
     dataCategories.contacts +
     dataCategories.browsing +
     dataCategories.media) / 5
  );

  const addData = useCallback((category: keyof DataCategories, amount: number, source: string) => {
    setDataCategories(prev => ({
      ...prev,
      [category]: Math.min(100, prev[category] + amount),
    }));

    setHistory(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      type: 'add',
      category,
      amount,
      source,
    }]);
  }, []);

  const removeData = useCallback((category: keyof DataCategories, amount: number, source: string) => {
    setDataCategories(prev => ({
      ...prev,
      [category]: Math.max(0, prev[category] - amount),
    }));

    setHistory(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      type: 'remove',
      category,
      amount,
      source,
    }]);
  }, []);

  const resetShadow = useCallback(() => {
    setDataCategories(INITIAL_CATEGORIES);
    setHistory([]);
  }, []);

  const getSeverity = useCallback(() => {
    if (shadowSize < 30) return 'low';
    if (shadowSize < 60) return 'medium';
    return 'high';
  }, [shadowSize]);

  return (
    <ShadowContext.Provider value={{
      shadowSize,
      dataCategories,
      history,
      addData,
      removeData,
      resetShadow,
      getSeverity,
    }}>
      {children}
    </ShadowContext.Provider>
  );
}

export function useShadow() {
  const context = useContext(ShadowContext);
  if (!context) {
    throw new Error('useShadow must be used within ShadowProvider');
  }
  return context;
}
