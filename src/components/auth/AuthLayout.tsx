import logo from '@/assets/Logo.png';
import { ReactNode } from 'react';

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="3A RIVA Investimentos" className="h-[53px] w-auto mb-5" />
          <h1 className="text-2xl font-display font-semibold text-foreground text-gray-950">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1 text-center text-slate-900">{subtitle}</p>}
        </div>
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8">{children}</div>
        <p className="text-[11px] text-muted-foreground/60 text-center mt-6">
          © 2026 3A RIVA Investimentos
        </p>
      </div>
    </div>
  );
}
