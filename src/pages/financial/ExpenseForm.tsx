import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateExpense } from '@/hooks/use-expenses';
import { FINANCIAL_COST_CENTERS, FINANCIAL_COMPANIES, EXPENSE_CATEGORIES } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const schema = z.object({
  description: z.string().min(1, 'Obrigatório'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  cost_center: z.string().min(1, 'Obrigatório'),
  company: z.string().min(1, 'Obrigatório'),
  category: z.string().min(1, 'Obrigatório'),
  card_name: z.string().optional(),
  expense_date: z.string().min(1, 'Obrigatório'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ExpenseForm() {
  const navigate = useNavigate();
  const create = useCreateExpense();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: '',
      amount: 0,
      cost_center: '',
      company: '',
      category: '',
      card_name: '',
      expense_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const onSubmit = (data: FormData) => {
    create.mutate(data, { onSuccess: () => navigate('/financial/expenses') });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Lançar Despesa</h1>
      <Card>
        <CardHeader><CardTitle>Nova Despesa de Cartão Corporativo</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem className="sm:col-span-2"><FormLabel>Descrição</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Valor (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="expense_date" render={({ field }) => (
                <FormItem><FormLabel>Data</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
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
              <FormField control={form.control} name="card_name" render={({ field }) => (
                <FormItem><FormLabel>Nome no Cartão</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem className="sm:col-span-2"><FormLabel>Observações</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="sm:col-span-2 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate('/financial/expenses')}>Cancelar</Button>
                <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Salvando...' : 'Salvar Despesa'}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
