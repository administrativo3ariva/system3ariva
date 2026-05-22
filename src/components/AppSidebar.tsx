import React, { useState } from 'react';
import { Package, BarChart3, ArrowLeftRight, FileUp, ClipboardList, PlusCircle, Users, LayoutDashboard, MapPin, ChevronDown, ChevronRight, Building2, Wrench, CalendarDays, Kanban, TrendingUp, CreditCard, FileText, DollarSign, Activity, PieChart, Target, SlidersHorizontal, Receipt } from 'lucide-react';
import logo from '@/assets/Logo.png';
import { useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useApp } from '@/contexts/AppContext';
import { STOCK_BRANCH_GROUPS, BRANCH_LABELS, StockBranch, ALL_BRANCHES, AppModule } from '@/lib/types';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const MODULE_TILES: { key: AppModule; label: string; icon: typeof Package }[] = [
  { key: 'stock', label: 'Estoque', icon: Package },
  { key: 'inventory', label: 'Patrimônio', icon: Building2 },
  { key: 'facilities', label: 'Facilities', icon: Wrench },
  { key: 'financial', label: 'Financeiro', icon: DollarSign },
];

const stockItems = [
  { title: 'Dashboard', url: '/stock/dashboard', icon: LayoutDashboard },
  { title: 'Produtos', url: '/stock/products', icon: Package },
  { title: 'Movimentações', url: '/stock/movements', icon: ArrowLeftRight },
  { title: 'Upload NFs', url: '/stock/nf-upload', icon: FileUp },
  { title: 'Colaboradores', url: '/stock/collaborators', icon: Users },
  { title: 'Indicadores', url: '/stock/indicators', icon: BarChart3 },
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

function ModuleSwitcher({ activeModule, setActiveModule, collapsed }: { activeModule: AppModule; setActiveModule: (m: AppModule) => void; collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <div className="p-3">
      <div className="grid grid-cols-2 gap-1.5">
        {MODULE_TILES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveModule(key)}
            className={`flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2.5 text-[11px] font-medium transition-all duration-200 ${
              activeModule === key
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FinancialMenu({ collapsed }: { collapsed: boolean }) {
  const location = useLocation();
  const [cardOpen, setCardOpen] = useState(location.pathname.startsWith('/financial/expenses'));
  const [reqOpen, setReqOpen] = useState(location.pathname.startsWith('/financial/requests'));
  const [opOpen, setOpOpen] = useState(location.pathname.startsWith('/financial/operational'));

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/50">Gestão Financeira</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/financial/dashboard" end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                {!collapsed && <span>Dashboard</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Cartão Corporativo - collapsible */}
          <Collapsible open={cardOpen} onOpenChange={setCardOpen}>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton className="hover:bg-sidebar-accent/50 cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">Cartão Corporativo</span>
                      <ChevronRight className={`h-3.5 w-3.5 transition-transform ${cardOpen ? 'rotate-90' : ''}`} />
                    </>
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenu className="ml-4 border-l border-sidebar-border pl-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/financial/expenses/new" end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <PlusCircle className="mr-2 h-3.5 w-3.5" />
                        {!collapsed && <span className="text-sm">Lançar Despesa</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/financial/expenses" end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <FileText className="mr-2 h-3.5 w-3.5" />
                        {!collapsed && <span className="text-sm">Despesas Lançadas</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          {/* Solicitações de Pagamento - collapsible */}
          <Collapsible open={reqOpen} onOpenChange={setReqOpen}>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton className="hover:bg-sidebar-accent/50 cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">Solic. Pagamento</span>
                      <ChevronRight className={`h-3.5 w-3.5 transition-transform ${reqOpen ? 'rotate-90' : ''}`} />
                    </>
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenu className="ml-4 border-l border-sidebar-border pl-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/financial/requests/new" end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <PlusCircle className="mr-2 h-3.5 w-3.5" />
                        {!collapsed && <span className="text-sm">Nova Solicitação</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/financial/requests" end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <ClipboardList className="mr-2 h-3.5 w-3.5" />
                        {!collapsed && <span className="text-sm">Solicitações</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          {/* Operacional - collapsible */}
          <Collapsible open={opOpen} onOpenChange={setOpOpen}>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton className="hover:bg-sidebar-accent/50 cursor-pointer">
                  <Activity className="mr-2 h-4 w-4" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">Operacional</span>
                      <ChevronRight className={`h-3.5 w-3.5 transition-transform ${opOpen ? 'rotate-90' : ''}`} />
                    </>
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenu className="ml-4 border-l border-sidebar-border pl-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/financial/operational/overview" end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <PieChart className="mr-2 h-3.5 w-3.5" />
                        {!collapsed && <span className="text-sm">Visão Geral</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/financial/operational/budget" end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <Target className="mr-2 h-3.5 w-3.5" />
                        {!collapsed && <span className="text-sm">Orçamento</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/financial/operational/adjust" end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
                        {!collapsed && <span className="text-sm">Ajustes de Orçamento</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/financial/operational/expenses" end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <Receipt className="mr-2 h-3.5 w-3.5" />
                        {!collapsed && <span className="text-sm">Despesas Operacionais</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/financial/reports" end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                <BarChart3 className="mr-2 h-4 w-4" />
                {!collapsed && <span>Relatórios</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function SimpleMenu({ items, label, collapsed }: { items: { title: string; url: string; icon: typeof Package }[]; label: string; collapsed: boolean }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/50">{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink to={item.url} end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                  <item.icon className="mr-2 h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { activeModule, setActiveModule, selectedBranch, setSelectedBranch, selectedFacilitiesBranch, setSelectedFacilitiesBranch } = useApp();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        {!collapsed && (
          <div className="flex items-center justify-center">
            <img src={logo} alt="3A RIVA Investimentos" className="h-10 object-contain" />
          </div>
        )}
        {collapsed && <img src={logo} alt="3A RIVA" className="h-6 object-contain mx-auto" />}
      </SidebarHeader>

      <SidebarContent>
        <ModuleSwitcher activeModule={activeModule} setActiveModule={setActiveModule} collapsed={collapsed} />

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
                        <DropdownMenuItem key={branch} onClick={() => setSelectedBranch(branch)} className={selectedBranch === branch ? 'bg-accent/10 text-accent font-medium' : ''}>
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
                <DropdownMenuItem onClick={() => setSelectedFacilitiesBranch(null)} className={selectedFacilitiesBranch === null ? 'bg-accent/10 text-accent font-medium' : ''}>
                  Todas as Filiais
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {ALL_BRANCHES.map(branch => (
                  <DropdownMenuItem key={branch} onClick={() => setSelectedFacilitiesBranch(branch)} className={selectedFacilitiesBranch === branch ? 'bg-accent/10 text-accent font-medium' : ''}>
                    {BRANCH_LABELS[branch] || branch}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {activeModule === 'stock' && <SimpleMenu items={stockItems} label="Gestão de Estoque" collapsed={collapsed} />}
        {activeModule === 'inventory' && <SimpleMenu items={inventoryItems} label="Inventário Patrimonial" collapsed={collapsed} />}
        {activeModule === 'facilities' && <SimpleMenu items={facilitiesItems} label="Gestão de Facilities" collapsed={collapsed} />}
        {activeModule === 'financial' && <FinancialMenu collapsed={collapsed} />}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <p className="text-[10px] text-sidebar-foreground/40 text-center">
            © 2026 3A RIVA Investimentos
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
