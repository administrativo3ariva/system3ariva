import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().trim().email('E-mail inválido').max(255),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres').max(72),
});

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (!authLoading && user) navigate(from, { replace: true });
  }, [user, authLoading, navigate, from]);

  const validate = () => {
    const result = schema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[e.path[0] as keyof typeof errors] = e.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      if (error.message.includes('Invalid login')) toast.error('E-mail ou senha incorretos');
      else if (error.message.includes('Email not confirmed')) toast.error('Confirme seu e-mail antes de entrar');
      else toast.error(error.message);
      return;
    }

    // Check approval status
    const { data: prof } = await supabase
      .from('profiles')
      .select('status')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (prof?.status === 'pendente') {
      await supabase.auth.signOut();
      setLoading(false);
      toast.warning(
        'Seu cadastro foi recebido com sucesso, mas precisa ser aprovado por um administrador. Você receberá um e-mail quando for liberado.',
        { duration: 8000 }
      );
      return;
    }
    if (prof?.status === 'inativo') {
      await supabase.auth.signOut();
      setLoading(false);
      toast.error('Sua conta está inativa. Contate o administrador.');
      return;
    }

    setLoading(false);
    toast.success('Bem-vindo de volta!');
    navigate(from, { replace: true });
  };

  return (
    <AuthLayout title="Entrar" subtitle="Acesse sua conta para continuar">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="voce@empresa.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (errors.email) validate(); }}
              onBlur={validate}
              className="pl-9"
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPwd ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (errors.password) validate(); }}
              onBlur={validate}
              className="pl-9 pr-10"
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
            Lembrar de mim
          </label>
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}
        </Button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <GoogleButton />

        <p className="text-center text-sm text-muted-foreground pt-2">
          Não tem conta?{' '}
          <Link to="/register" className="text-primary hover:underline font-medium">Cadastre-se</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
