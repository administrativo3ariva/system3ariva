import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateExpense } from '@/hooks/use-expenses';
import { FINANCIAL_COST_CENTERS, FINANCIAL_COMPANIES, EXPENSE_CATEGORIES, COMPANY_CARD_MAP, CORPORATE_CARDS, FinancialCompany } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/CurrencyInput';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, Building2, Tag, FileText, Upload, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const schema = z.object({
  description: z.string().min(1, 'Obrigatório'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  cost_center: z.string().min(1, 'Obrigatório'),
  company: z.string().min(1, 'Obrigatório'),
  category: z.string().min(1, 'Obrigatório'),
  card_name: z.string().optional(),
  expense_date: z.string().min(1, 'Obrigatório'),
  notes: z.string().optional(),
  is_installment: z.boolean().optional(),
  installment_count: z.coerce.number().min(2).max(48).optional(),
});

type FormData = z.infer<typeof schema>;

export default function ExpenseForm() {
  const navigate = useNavigate();
  const create = useCreateExpense();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      is_installment: false,
      installment_count: undefined,
    },
  });

  const selectedCard = form.watch('card_name');
  const isInstallment = form.watch('is_installment');
  const hasReceipt = !!receiptFile;

  const handleCompanyChange = useCallback((value: string) => {
    form.setValue('company', value);
    const defaultCard = COMPANY_CARD_MAP[value as FinancialCompany];
    if (defaultCard) {
      form.setValue('card_name', defaultCard);
    } else {
      form.setValue('card_name', '');
    }
  }, [form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 10MB.');
        return;
      }
      setReceiptFile(file);
    }
  };

  const onSubmit = async (data: FormData) => {
    let receipt_url: string | undefined;

    if (receiptFile) {
      setUploading(true);
      const ext = receiptFile.name.split('.').pop();
      const path = `receipts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('nf-files').upload(path, receiptFile);
      if (uploadError) {
        toast.error('Erro ao enviar comprovante: ' + uploadError.message);
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('nf-files').getPublicUrl(path);
      receipt_url = urlData.publicUrl;
      setUploading(false);
    }

    create.mutate({
      description: data.description,
      amount: data.amount,
      cost_center: data.cost_center,
      company: data.company,
      category: data.category,
      card_name: data.card_name,
      expense_date: data.expense_date,
      notes: data.notes,
      ...(receipt_url ? { receipt_url } : {}),
    } as any, { onSuccess: () => navigate('/financial/expenses') });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lançar Despesa</h1>
          <p className="text-sm text-muted-foreground mt-1">Cartão Corporativo</p>
        </div>
        {selectedCompany && COMPANY_CARD_MAP[selectedCompany as FinancialCompany] && (
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm border-primary/30 bg-primary/5">
            <CreditCard className="h-3.5 w-3.5" />
            {COMPANY_CARD_MAP[selectedCompany as FinancialCompany]}
          </Badge>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Identification */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <FileText className="h-4 w-4" />
                Identificação
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição da Despesa</FormLabel>
                  <FormControl><Input placeholder="Ex: Compra de material de escritório" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl><CurrencyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="expense_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Despesa</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input type="date" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Classification */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Tag className="h-4 w-4" />
                Classificação
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="company" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa Contratante</FormLabel>
                    <FormControl>
                      <Select onValueChange={handleCompanyChange} value={field.value}>
                        <SelectTrigger>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Selecione a empresa" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {FINANCIAL_COMPANIES.map(c => (
                            <SelectItem key={c} value={c}>
                              <div className="flex items-center justify-between w-full gap-3">
                                <span>{c}</span>
                                {COMPANY_CARD_MAP[c as FinancialCompany] && (
                                  <span className="text-xs text-muted-foreground">{COMPANY_CARD_MAP[c as FinancialCompany]}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="card_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cartão Utilizado</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Selecione o cartão" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {CORPORATE_CARDS.map(c => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="cost_center" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Centro de Custo</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{FINANCIAL_COST_CENTERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Receipt / NF */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Upload className="h-4 w-4" />
                Comprovante / Nota Fiscal
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
              />

              {!receiptFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    "hover:border-primary/50 hover:bg-primary/5",
                    "border-muted-foreground/20"
                  )}
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-foreground">Clique para anexar o comprovante</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG ou PNG • Máx 10MB</p>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground truncate max-w-[300px]">{receiptFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(receiptFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => { setReceiptFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {!hasReceipt && (
                <div className="flex items-start gap-2 rounded-md bg-yellow-500/10 border border-yellow-500/20 p-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    Sem comprovante anexado. A despesa ficará marcada como <strong>pendente de NF</strong> e você poderá anexar depois.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 4: Notes */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl><Textarea placeholder="Informações adicionais sobre a despesa..." rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end sticky bottom-4">
            <Button type="button" variant="outline" size="lg" onClick={() => navigate('/financial/expenses')}>
              Cancelar
            </Button>
            <Button type="submit" size="lg" disabled={create.isPending || uploading}>
              {create.isPending || uploading ? 'Salvando...' : 'Lançar Despesa'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
