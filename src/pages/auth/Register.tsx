import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Mail, Lock, User as UserIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getPasswordStrength } from '@/lib/password-strength';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Nome muito curto').max(120),
  email: z.string().trim().email('E-mail inválido').max(255),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'As senhas não conferem', path: ['confirm'] });

export default function Register() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = getPasswordStrength(password);
  const barColor = strength.level === 'weak' ? 'bg-destructive' : strength.level === 'medium' ? 'bg-warning' : 'bg-success';

  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard', { replace: true });
  }, [user, authLoading, navigate]);

  const validate = () => {
    const result = schema.safeParse({ fullName, email, password, confirm });
    if (!result.success) {
      const fe: Record<string, string> = {};
      result.error.errors.forEach((e) => { if (e.path[0]) fe[e.path[0] as string] = e.message; });
      setErrors(fe);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      if (error.message.includes('already')) toast.error('Este e-mail já está cadastrado');
      else toast.error(error.message);
      return;
    }
    toast.success('Conta criada! Verifique seu e-mail para confirmar.');
    navigate('/login');
  };

  return (
    <AuthLayout title="Criar conta" subtitle="Comece a usar o sistema em segundos">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nome completo</Label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="fullName" value={fullName} onChange={(e) => { setFullName(e.target.value); if (errors.fullName) validate(); }} onBlur={validate} className="pl-9" placeholder="Seu nome" />
          </div>
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) validate(); }} onBlur={validate} className="pl-9" placeholder="voce@empresa.com" autoComplete="email" />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="password" type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); if (errors.password) validate(); }} onBlur={validate} className="pl-9 pr-10" placeholder="••••••••" autoComplete="new-password" />
            <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i < (strength.level === 'weak' ? 1 : strength.level === 'medium' ? 2 : 3) ? barColor : 'bg-muted')} />
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">Força: <span className="font-medium text-foreground">{strength.label}</span></p>
            </div>
          )}
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="confirm" type={showPwd ? 'text' : 'password'} value={confirm} onChange={(e) => { setConfirm(e.target.value); if (errors.confirm) validate(); }} onBlur={validate} className="pl-9" placeholder="••••••••" autoComplete="new-password" />
          </div>
          {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar conta'}
        </Button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <GoogleButton label="Cadastrar com Google" />

        <p className="text-center text-sm text-muted-foreground pt-2">
          Já tem conta?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">Entrar</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
