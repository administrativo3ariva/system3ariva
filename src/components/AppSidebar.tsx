import React from 'react';
import { Package, BarChart3, ArrowLeftRight, FileUp, ClipboardList, PlusCircle, Users, LayoutDashboard, MapPin, ChevronDown, Building2, Wrench, CalendarDays, Kanban, TrendingUp } from 'lucide-react';
import logo from '@/assets/Logo.png';
import { useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useApp } from '@/contexts/AppContext';
import { STOCK_BRANCH_GROUPS, BRANCH_LABELS, StockBranch, ALL_BRANCHES } from '@/lib/types';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  { title: 'Filiais', url: '/inventory/branches', icon: Building2 },
];

const facilitiesItems = [
  { title: 'Dashboard', url: '/facilities/dashboard', icon: LayoutDashboard },
  { title: 'Calendário', url: '/facilities/calendar', icon: CalendarDays },
  { title: 'Kanban', url: '/facilities/kanban', icon: Kanban },
  { title: 'Desempenho', url: '/facilities/performance', icon: TrendingUp },
];

export function AppSidebar() {
  const { activeModule, setActiveModule, selectedBranch, setSelectedBranch, selectedFacilitiesBranch, setSelectedFacilitiesBranch } = useApp();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        {!collapsed && (
          <div className="flex items-center justify-center">
            <img src={logo} alt="3A Riva Investimentos" className="h-10 object-contain" />
          </div>
        )}
        {collapsed && <img src={logo} alt="3A Riva" className="h-6 object-contain mx-auto" />}
      </SidebarHeader>

      <SidebarContent>
        {/* Context Switcher */}
        {!collapsed && (
          <div className="p-3">
            <div className="flex rounded-md bg-sidebar-accent p-1">
              <button
                onClick={() => setActiveModule('stock')}
                className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                  activeModule === 'stock'
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
                }`}
              >
                Estoque
              </button>
              <button
                onClick={() => setActiveModule('inventory')}
                className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                  activeModule === 'inventory'
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
                }`}
              >
                Patrimônio
              </button>
              <button
                onClick={() => setActiveModule('facilities')}
                className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                  activeModule === 'facilities'
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
                }`}
              >
                Facilities
              </button>
            </div>
          </div>
        )}

        {/* Branch Selector — Stock only */}
        {activeModule === 'stock' && !collapsed && (
          <div className="px-3 pb-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                  <MapPin className="h-3.5 w-3.5 text-sidebar-primary shrink-0" />
                  <span className="truncate flex-1 text-left">{BRANCH_LABELS[selectedBranch] || selectedBranch}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/50 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {STOCK_BRANCH_GROUPS.map((group, gi) => (
                  <React.Fragment key={group.label}>
                    {gi > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel className="text-xs text-muted-foreground">{group.label}</DropdownMenuLabel>
                    <DropdownMenuGroup>
                      {group.branches.map(branch => (
                        <DropdownMenuItem
                          key={branch}
                          onClick={() => setSelectedBranch(branch)}
                          className={selectedBranch === branch ? 'bg-accent/10 text-accent font-medium' : ''}
                        >
                          {BRANCH_LABELS[branch] || branch}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Branch Selector — Facilities */}
        {activeModule === 'facilities' && !collapsed && (
          <div className="px-3 pb-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                  <MapPin className="h-3.5 w-3.5 text-sidebar-primary shrink-0" />
                  <span className="truncate flex-1 text-left">{selectedFacilitiesBranch ? (BRANCH_LABELS[selectedFacilitiesBranch] || selectedFacilitiesBranch) : 'Todas as Filiais'}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/50 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem
                  onClick={() => setSelectedFacilitiesBranch(null)}
                  className={selectedFacilitiesBranch === null ? 'bg-accent/10 text-accent font-medium' : ''}
                >
                  Todas as Filiais
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {ALL_BRANCHES.map(branch => (
                  <DropdownMenuItem
                    key={branch}
                    onClick={() => setSelectedFacilitiesBranch(branch)}
                    className={selectedFacilitiesBranch === branch ? 'bg-accent/10 text-accent font-medium' : ''}
                  >
                    {BRANCH_LABELS[branch] || branch}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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

        {activeModule === 'facilities' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50">Gestão de Facilities</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {facilitiesItems.map((item) => (
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
