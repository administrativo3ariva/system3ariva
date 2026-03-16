import { Package, BarChart3, ArrowLeftRight, FileUp, ClipboardList, PlusCircle, Users, LayoutDashboard } from 'lucide-react';
import logo from '@/assets/Logo.png';
import { useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useApp } from '@/contexts/AppContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const stockItems = [
  { title: 'Dashboard', url: '/stock/dashboard', icon: LayoutDashboard },
  { title: 'Produtos', url: '/stock/products', icon: Package },
  { title: 'Movimentações', url: '/stock/movements', icon: ArrowLeftRight },
  { title: 'Upload NFs', url: '/stock/nf-upload', icon: FileUp },
  { title: 'Colaboradores', url: '/stock/collaborators', icon: Users },
];

const inventoryItems = [
  { title: 'Dashboard', url: '/inventory/dashboard', icon: BarChart3 },
  { title: 'Inventário', url: '/inventory/list', icon: ClipboardList },
  { title: 'Cadastro', url: '/inventory/register', icon: PlusCircle },
];

export function AppSidebar() {
  const { activeModule, setActiveModule } = useApp();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-sidebar-primary" />
            <div>
              <h1 className="font-display text-sm font-bold text-sidebar-foreground">3A Riva</h1>
              <p className="text-[10px] text-sidebar-foreground/60">Investimentos</p>
            </div>
          </div>
        )}
        {collapsed && <Building2 className="h-6 w-6 text-sidebar-primary mx-auto" />}
      </SidebarHeader>

      <SidebarContent>
        {/* Context Switcher */}
        {!collapsed && (
          <div className="p-3">
            <div className="flex rounded-md bg-sidebar-accent p-1">
              <button
                onClick={() => setActiveModule('stock')}
                className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeModule === 'stock'
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
                }`}
              >
                Estoque
              </button>
              <button
                onClick={() => setActiveModule('inventory')}
                className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeModule === 'inventory'
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
                }`}
              >
                Patrimônio
              </button>
            </div>
          </div>
        )}

        {activeModule === 'stock' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50">Gestão de Estoque</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {stockItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-sidebar-accent/50"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {activeModule === 'inventory' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50">Inventário Patrimonial</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {inventoryItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-sidebar-accent/50"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <p className="text-[10px] text-sidebar-foreground/40 text-center">
            © 2026 3A Riva Investimentos
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
