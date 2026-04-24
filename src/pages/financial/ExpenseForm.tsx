import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateExpense, useUpdateExpense, useExpenses } from '@/hooks/use-expenses';
import { FINANCIAL_COST_CENTERS, FINANCIAL_COMPANIES, EXPENSE_CATEGORIES, COMPANY_CARD_MAP, CORPORATE_CARDS, FinancialCompany } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { SupplierAutocomplete } from '@/components/SupplierAutocomplete';
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
import { AllocationSplitter, Allocation, validateAllocations } from '@/components/AllocationSplitter';

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
  supplier: z.string().optional(),
  supplier_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ExpenseForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;
  const isFromNf = searchParams.get('from_nf') === 'true';

  const create = useCreateExpense();
  const update = useUpdateExpense();
  const { data: expenses = [] } = useExpenses();
  const editingExpense = isEditing ? expenses.find((e: any) => e.id === editId) : null;

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
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
      supplier: '',
      supplier_id: '',
    },
  });

  

  // Load existing expense data for editing
  useEffect(() => {
    if (editingExpense) {
      form.reset({
        description: editingExpense.description,
        amount: Number(editingExpense.amount),
        cost_center: editingExpense.cost_center,
        company: editingExpense.company,
        category: editingExpense.category,
        card_name: editingExpense.card_name || '',
        expense_date: editingExpense.expense_date,
        notes: editingExpense.notes || '',
        is_installment: (editingExpense as any).is_installment || false,
        installment_count: (editingExpense as any).installment_count || undefined,
        supplier: (editingExpense as any).supplier || '',
        supplier_id: (editingExpense as any).supplier_id || '',
      });
      if (editingExpense.receipt_url) {
        setExistingReceiptUrl(editingExpense.receipt_url);
      }
      const existingAlloc = (editingExpense as any).allocations;
      if (Array.isArray(existingAlloc) && existingAlloc.length > 0) {
        setAllocations(existingAlloc);
        setSplitEnabled(true);
      }
    }
  }, [editingExpense, form]);

  // Pre-fill from NF link
  useEffect(() => {
    if (isFromNf && !isEditing) {
      const supplier = searchParams.get('supplier');
      const amount = searchParams.get('amount');
      const costCenter = searchParams.get('cost_center');
      const receiptUrl = searchParams.get('receipt_url');
      const nfName = searchParams.get('nf_name');
      const issueDate = searchParams.get('issue_date');

      if (supplier) form.setValue('supplier', supplier);
      if (amount) form.setValue('amount', Number(amount));
      if (costCenter) form.setValue('cost_center', costCenter);
      if (receiptUrl) setExistingReceiptUrl(receiptUrl);
      if (nfName) form.setValue('description', `NF: ${nfName}`);
      if (issueDate) form.setValue('expense_date', issueDate);
    }
  }, [isFromNf, isEditing, searchParams, form]);

  const selectedCard = form.watch('card_name');
  const isInstallment = form.watch('is_installment');
  const hasReceipt = !!receiptFile || !!existingReceiptUrl;

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
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 50MB.');
        return;
      }
      setReceiptFile(file);
      setExistingReceiptUrl(null);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (splitEnabled) {
      const err = validateAllocations(allocations, data.amount);
      if (err) { toast.error(err); return; }
    }
    let receipt_url: string | undefined = existingReceiptUrl || undefined;

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

    const payload = {
      description: data.description,
      amount: data.amount,
      cost_center: data.cost_center,
      company: data.company,
      category: data.category,
      card_name: data.card_name,
      expense_date: data.expense_date,
      notes: data.notes,
      supplier: data.supplier || null,
      supplier_id: data.supplier_id || null,
      is_installment: data.is_installment || false,
      installment_count: data.is_installment ? data.installment_count : null,
      installment_current: data.is_installment ? 1 : null,
      allocations: splitEnabled && allocations.length > 0 ? allocations : null,
      ...(receipt_url ? { receipt_url } : {}),
    } as any;

    if (isEditing && editId) {
      update.mutate({ id: editId, ...payload }, { onSuccess: () => navigate('/financial/expenses') });
    } else {
      create.mutate(payload, {
        onSuccess: async () => {
          // Mark NF as vinculado if coming from NF
          const nfId = searchParams.get('nf_id');
          if (isFromNf && nfId) {
            await supabase.from('nf_uploads').update({ status: 'vinculado' }).eq('id', nfId);
          }
          navigate('/financial/expenses');
        },
      });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isEditing ? 'Editar Despesa' : 'Lançar Despesa'}</h1>
          <p className="text-sm text-muted-foreground mt-1">Cartão Corporativo</p>
        </div>
        {selectedCard && (
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm border-primary/30 bg-primary/5">
            <CreditCard className="h-3.5 w-3.5" />
            {selectedCard}
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
              <FormField control={form.control} name="supplier" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor</FormLabel>
                  <FormControl>
                    <SupplierAutocomplete
                      value={field.value || ''}
                      onChange={(name) => field.onChange(name)}
                      onSelectSupplier={(s) => form.setValue('supplier_id', s.id)}
                    />
                  </FormControl>
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

              {/* Installment toggle - only when a card is selected */}
              {selectedCard && (
                <div className="border-t pt-4 mt-4 space-y-3">
                  <FormField control={form.control} name="is_installment" render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value || false}
                          onChange={(e) => {
                            field.onChange(e.target.checked);
                            if (!e.target.checked) form.setValue('installment_count', undefined);
                          }}
                          className="h-4 w-4 rounded border-input accent-primary"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 text-sm cursor-pointer">Compra parcelada?</FormLabel>
                    </FormItem>
                  )} />

                  {isInstallment && (
                    <FormField control={form.control} name="installment_count" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de parcelas</FormLabel>
                        <FormControl>
                          <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString() || ''}>
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Parcelas" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => i + 2).map(n => (
                                <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 2.5: Allocation / Rateio */}
          <AllocationSplitter
            enabled={splitEnabled}
            onToggle={(v) => {
              setSplitEnabled(v);
              if (!v) setAllocations([]);
            }}
            totalAmount={form.watch('amount') || 0}
            primaryCategory={form.watch('category') || ''}
            allocations={allocations}
            onChange={setAllocations}
            categoryOptions={EXPENSE_CATEGORIES}
          />

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

              {existingReceiptUrl && !receiptFile ? (
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Comprovante já anexado</p>
                      <a href={existingReceiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Ver comprovante</a>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>Trocar</Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setExistingReceiptUrl(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : !receiptFile ? (
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
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG ou PNG • Máx 50MB</p>
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
            <Button type="submit" size="lg" disabled={create.isPending || update.isPending || uploading}>
              {create.isPending || update.isPending || uploading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Lançar Despesa'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
