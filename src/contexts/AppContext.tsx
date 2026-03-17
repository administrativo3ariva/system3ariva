import React, { createContext, useContext, useState } from 'react';
import { AppModule, StockBranch } from '@/lib/types';

interface AppContextType {
  activeModule: AppModule;
  setActiveModule: (m: AppModule) => void;
  selectedBranch: StockBranch;
  setSelectedBranch: (b: StockBranch) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeModule, setActiveModule] = useState<AppModule>('stock');
  const [selectedBranch, setSelectedBranch] = useState<StockBranch>('BH-Matriz');

  return (
    <AppContext.Provider value={{ activeModule, setActiveModule, selectedBranch, setSelectedBranch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
