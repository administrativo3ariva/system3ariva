import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { AppLayout } from "@/components/AppLayout";
import StockDashboard from "@/pages/stock/StockDashboard";
import StockProducts from "@/pages/stock/StockProducts";
import StockMovements from "@/pages/stock/StockMovements";
import NfUploadPage from "@/pages/stock/NfUploadPage";
import CollaboratorsPage from "@/pages/stock/CollaboratorsPage";
import InventoryDashboard from "@/pages/inventory/InventoryDashboard";
import InventoryList from "@/pages/inventory/InventoryList";
import InventoryRegister from "@/pages/inventory/InventoryRegister";
import InventoryBranches from "@/pages/inventory/InventoryBranches";
import FacilitiesDashboard from "@/pages/facilities/FacilitiesDashboard";
import FacilitiesCalendar from "@/pages/facilities/FacilitiesCalendar";
import FacilitiesKanban from "@/pages/facilities/FacilitiesKanban";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/stock/dashboard" replace />} />
            <Route element={<AppLayout />}>
              <Route path="/stock/dashboard" element={<StockDashboard />} />
              <Route path="/stock/products" element={<StockProducts />} />
              <Route path="/stock/movements" element={<StockMovements />} />
              <Route path="/stock/nf-upload" element={<NfUploadPage />} />
              <Route path="/stock/collaborators" element={<CollaboratorsPage />} />
              <Route path="/inventory/dashboard" element={<InventoryDashboard />} />
              <Route path="/inventory/list" element={<InventoryList />} />
              <Route path="/inventory/register" element={<InventoryRegister />} />
              <Route path="/inventory/branches" element={<InventoryBranches />} />
              <Route path="/facilities/dashboard" element={<FacilitiesDashboard />} />
              <Route path="/facilities/calendar" element={<FacilitiesCalendar />} />
              <Route path="/facilities/kanban" element={<FacilitiesKanban />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
