import React, { createContext, useContext, useState } from 'react';
import { AppModule } from '@/lib/types';

interface AppContextType {
  activeModule: AppModule;
  setActiveModule: (m: AppModule) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeModule, setActiveModule] = useState<AppModule>('stock');

  return (
    <AppContext.Provider value={{ activeModule, setActiveModule }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
