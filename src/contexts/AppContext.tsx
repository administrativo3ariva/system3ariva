import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppModule, Product, StockMovement, Collaborator, AssetItem, NfUpload } from '@/lib/types';
import { mockProducts, mockMovements, mockCollaborators, mockAssets, mockNfUploads } from '@/lib/mock-data';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  return fallback;
}

function usePersisted<T>(key: string, fallback: T) {
  const [state, setState] = useState<T>(() => loadFromStorage(key, fallback));
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  return [state, setState] as const;
}

interface AppContextType {
  activeModule: AppModule;
  setActiveModule: (m: AppModule) => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  movements: StockMovement[];
  setMovements: React.Dispatch<React.SetStateAction<StockMovement[]>>;
  collaborators: Collaborator[];
  setCollaborators: React.Dispatch<React.SetStateAction<Collaborator[]>>;
  assets: AssetItem[];
  setAssets: React.Dispatch<React.SetStateAction<AssetItem[]>>;
  nfUploads: NfUpload[];
  setNfUploads: React.Dispatch<React.SetStateAction<NfUpload[]>>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeModule, setActiveModule] = useState<AppModule>('stock');
  const [products, setProducts] = usePersisted<Product[]>('app_products', mockProducts);
  const [movements, setMovements] = usePersisted<StockMovement[]>('app_movements', mockMovements);
  const [collaborators, setCollaborators] = usePersisted<Collaborator[]>('app_collaborators', mockCollaborators);
  const [assets, setAssets] = usePersisted<AssetItem[]>('app_assets', mockAssets);
  const [nfUploads, setNfUploads] = usePersisted<NfUpload[]>('app_nfuploads', mockNfUploads);

  return (
    <AppContext.Provider value={{
      activeModule, setActiveModule,
      products, setProducts,
      movements, setMovements,
      collaborators, setCollaborators,
      assets, setAssets,
      nfUploads, setNfUploads,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
