import React, { createContext, useContext, useState } from 'react';
import { AppModule, Product, StockMovement, Collaborator, AssetItem, NfUpload } from '@/lib/types';
import { mockProducts, mockMovements, mockCollaborators, mockAssets, mockNfUploads } from '@/lib/mock-data';

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
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [movements, setMovements] = useState<StockMovement[]>(mockMovements);
  const [collaborators, setCollaborators] = useState<Collaborator[]>(mockCollaborators);
  const [assets, setAssets] = useState<AssetItem[]>(mockAssets);
  const [nfUploads, setNfUploads] = useState<NfUpload[]>(mockNfUploads);

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
