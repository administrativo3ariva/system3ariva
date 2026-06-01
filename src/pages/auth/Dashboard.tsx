import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Package, DollarSign, Building2, Wrench } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import logo from '@/assets/Logo.png';

const modules = [
  { label: 'Estoque', icon: Package, path: '/stock/dashboard' },
  { label: 'Patrimônio', icon: Building2, path: '/inventory/dashboard' },
  { label: 'Facilities', icon: Wrench, path: '/facilities/dashboard' },
  { label: 'Financeiro', icon: DollarSign, path: '/financial/dashboard' },
];

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'usuário';

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="3A RIVA Investimentos" className="h-8 w-auto" />
            <span className="font-display font-semibold text-foreground hidden sm:inline">​</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-foreground">
            Olá, {displayName}!
          </h1>
          <p className="text-muted-foreground mt-1">Escolha um módulo para começar.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((m) => (
            <Card key={m.path} onClick={() => navigate(m.path)} className="cursor-pointer hover:border-primary hover:shadow-md transition-all p-6 flex flex-col items-center gap-3 text-center">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <m.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium text-foreground">{m.label}</p>
            </Card>
          ))}
        </div>
        <div className="mt-8">
          <Button variant="ghost" onClick={() => navigate('/stock/dashboard')}>
            <LayoutDashboard className="h-4 w-4" /> Ir para o painel principal
          </Button>
        </div>
      </main>
    </div>
  );
}
