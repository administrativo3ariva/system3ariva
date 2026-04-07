import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePaymentRequest } from '@/hooks/use-payment-requests';
import { FINANCIAL_COST_CENTERS, FINANCIAL_COMPANIES, EXPENSE_CATEGORIES } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/CurrencyInput';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const schema = z.object({
  description: z.string().min(1, 'Obrigatório'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  cost_center: z.string().min(1, 'Obrigatório'),
  company: z.string().min(1, 'Obrigatório'),
  category: z.string().min(1, 'Obrigatório'),
  supplier: z.string().optional(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function PaymentRequestForm() {
  const navigate = useNavigate();
  const create = useCreatePaymentRequest();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: '',
      amount: 0,
      cost_center: '',
      company: '',
      category: '',
      supplier: '',
      due_date: '',
      notes: '',
    },
  });

  const onSubmit = (data: FormData) => {
    create.mutate({
      description: data.description,
      amount: data.amount,
      cost_center: data.cost_center,
      company: data.company,
      category: data.category,
      supplier: data.supplier,
      due_date: data.due_date || undefined,
      notes: data.notes,
    }, { onSuccess: () => navigate('/financial/requests') });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Nova Solicitação de Pagamento</h1>
      <Card>
        <CardHeader><CardTitle>Detalhes da Solicitação</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem className="sm:col-span-2"><FormLabel>Descrição</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Valor</FormLabel><FormControl><CurrencyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="supplier" render={({ field }) => (
                <FormItem><FormLabel>Fornecedor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="cost_center" render={({ field }) => (
                <FormItem><FormLabel>Centro de Custo</FormLabel><FormControl>
                  <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{FINANCIAL_COST_CENTERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="company" render={({ field }) => (
                <FormItem><FormLabel>Empresa Contratante</FormLabel><FormControl>
                  <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{FINANCIAL_COMPANIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Categoria</FormLabel><FormControl>
                  <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="due_date" render={({ field }) => (
                <FormItem><FormLabel>Data de Vencimento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem className="sm:col-span-2"><FormLabel>Observações</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="sm:col-span-2 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate('/financial/requests')}>Cancelar</Button>
                <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Salvando...' : 'Criar Solicitação'}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
