import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getPasswordStrength } from '@/lib/password-strength';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const strength = getPasswordStrength(password);
  const barColor = strength.level === 'weak' ? 'bg-destructive' : strength.level === 'medium' ? 'bg-warning' : 'bg-success';

  useEffect(() => {
    // Supabase auto-parses the recovery token from URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('A senha precisa ter ao menos 8 caracteres'); return; }
    if (password !== confirm) { toast.error('As senhas não conferem'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Senha atualizada com sucesso!');
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <AuthLayout title="Nova senha" subtitle="Defina uma nova senha para sua conta">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nova senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="password" type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 pr-10" placeholder="••••••••" />
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
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="confirm" type={showPwd ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pl-9" placeholder="••••••••" />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading || !ready}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Atualizar senha'}
        </Button>
        {!ready && <p className="text-xs text-muted-foreground text-center">Validando link de recuperação...</p>}
      </form>
    </AuthLayout>
  );
}
