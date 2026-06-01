import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const schema = z.string().trim().email('E-mail inválido');

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(email);
    if (!result.success) { setError(result.error.errors[0].message); return; }
    setError(undefined);
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) { toast.error(err.message); return; }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthLayout title="Verifique seu e-mail" subtitle={`Enviamos um link de recuperação para ${email}`}>
        <div className="flex flex-col items-center gap-4 py-4">
          <CheckCircle2 className="h-12 w-12 text-success" />
          <p className="text-sm text-muted-foreground text-center">
            Clique no link recebido para redefinir sua senha. Não esqueça de checar o spam.
          </p>
          <Link to="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Esqueceu a senha?" subtitle="Vamos enviar um link para redefini-la">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" placeholder="usuário@3ariva.com.br" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar link'}
        </Button>
        <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 justify-center w-full">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login
        </Link>
      </form>
    </AuthLayout>
  );
}
