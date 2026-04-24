import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePaymentRequest, useUpdatePaymentRequest, usePaymentRequests } from '@/hooks/use-payment-requests';
import { useCreateSupplier, Supplier } from '@/hooks/use-suppliers';
import { FINANCIAL_COST_CENTERS, FINANCIAL_COMPANIES, EXPENSE_CATEGORIES } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/CurrencyInput';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { SupplierAutocomplete } from '@/components/SupplierAutocomplete';
import {
  FileText, Tag, Building2, Upload, X, AlertTriangle, CheckCircle2,
  Calendar, Landmark, QrCode, FileBarChart, CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AllocationSplitter, Allocation, validateAllocations } from '@/components/AllocationSplitter';
import { normalizePrimary } from '@/lib/allocation-utils';

const PAYMENT_METHODS = [
  { value: 'boleto', label: 'Boleto', icon: FileBarChart },
  { value: 'pix', label: 'PIX', icon: QrCode },
  { value: 'transferencia', label: 'Transferência', icon: Landmark },
] as const;

const schema = z.object({
  description: z.string().min(1, 'Obrigatório'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  cost_center: z.string().min(1, 'Obrigatório'),
  company: z.string().min(1, 'Obrigatório'),
  category: z.string().min(1, 'Obrigatório'),
  supplier: z.string().optional(),
  payment_method: z.string().min(1, 'Selecione a forma de pagamento'),
  request_date: z.string().min(1, 'Obrigatório'),
  due_date: z.string().optional(),
  pix_key: z.string().optional(),
  bank_name: z.string().optional(),
  bank_agency: z.string().optional(),
  bank_account: z.string().optional(),
  bank_account_type: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function PaymentRequestForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;
  const isFromNf = searchParams.get('from_nf') === 'true';

  const create = useCreatePaymentRequest();
  const update = useUpdatePaymentRequest();
  const { data: requests = [] } = usePaymentRequests();
  const editingRequest = isEditing ? requests.find((r: any) => r.id === editId) : null;

  const createSupplier = useCreateSupplier();
  const [boletoFile, setBoletoFile] = useState<File | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [existingBoletoUrl, setExistingBoletoUrl] = useState<string | null>(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const boletoInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: '',
      amount: 0,
      cost_center: '',
      company: '',
      category: '',
      supplier: '',
      payment_method: '',
      request_date: new Date().toISOString().split('T')[0],
      due_date: '',
      pix_key: '',
      bank_name: '',
      bank_agency: '',
      bank_account: '',
      bank_account_type: 'corrente',
      notes: '',
    },
  });

  // Load existing data for editing
  useEffect(() => {
    if (editingRequest) {
      form.reset({
        description: editingRequest.description,
        amount: Number(editingRequest.amount),
        cost_center: editingRequest.cost_center,
        company: editingRequest.company,
        category: editingRequest.category,
        supplier: editingRequest.supplier || '',
        payment_method: editingRequest.payment_method || '',
        request_date: editingRequest.request_date || new Date().toISOString().split('T')[0],
        due_date: editingRequest.due_date || '',
        pix_key: editingRequest.pix_key || '',
        bank_name: editingRequest.bank_name || '',
        bank_agency: editingRequest.bank_agency || '',
        bank_account: editingRequest.bank_account || '',
        bank_account_type: editingRequest.bank_account_type || 'corrente',
        notes: editingRequest.notes || '',
      });
      if (editingRequest.supplier_id) setSelectedSupplierId(editingRequest.supplier_id);
      if (editingRequest.boleto_url) setExistingBoletoUrl(editingRequest.boleto_url);
      if (editingRequest.receipt_url) setExistingReceiptUrl(editingRequest.receipt_url);
      const existingAlloc = (editingRequest as any).allocations;
      if (Array.isArray(existingAlloc) && existingAlloc.length > 0) {
        setAllocations(existingAlloc);
        setSplitEnabled(true);
      }
    }
  }, [editingRequest, form]);

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
      if (issueDate) form.setValue('due_date', issueDate);
    }
  }, [isFromNf, isEditing, searchParams, form]);

  const paymentMethod = form.watch('payment_method');

  const handleSelectSupplier = useCallback((supplier: Supplier) => {
    setSelectedSupplierId(supplier.id);
    if (supplier.payment_method) {
      form.setValue('payment_method', supplier.payment_method);
    }
    if (supplier.pix_key) form.setValue('pix_key', supplier.pix_key);
    if (supplier.bank_name) form.setValue('bank_name', supplier.bank_name);
    if (supplier.bank_agency) form.setValue('bank_agency', supplier.bank_agency);
    if (supplier.bank_account) form.setValue('bank_account', supplier.bank_account);
    if (supplier.bank_account_type) form.setValue('bank_account_type', supplier.bank_account_type);
  }, [form]);

  const uploadFile = async (file: File, prefix: string) => {
    const ext = file.name.split('.').pop();
    const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('nf-files').upload(path, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('nf-files').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleFileChange = (setter: (f: File | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 50MB.');
        return;
      }
      setter(file);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (splitEnabled) {
      const err = validateAllocations(allocations, data.amount);
      if (err) { toast.error(err); return; }
    }
    setUploading(true);
    try {
      let boleto_url: string | undefined = existingBoletoUrl || undefined;
      let receipt_url: string | undefined = existingReceiptUrl || undefined;

      if (boletoFile) boleto_url = await uploadFile(boletoFile, 'boletos');
      if (receiptFile) receipt_url = await uploadFile(receiptFile, 'receipts');

      // Save supplier if new
      let supplier_id = selectedSupplierId;
      if (data.supplier && !supplier_id) {
        const newSupplier = await createSupplier.mutateAsync({
          name: data.supplier,
          payment_method: data.payment_method || null,
          pix_key: data.pix_key || null,
          bank_name: data.bank_name || null,
          bank_agency: data.bank_agency || null,
          bank_account: data.bank_account || null,
          bank_account_type: data.bank_account_type || null,
        });
        supplier_id = newSupplier.id;
      }

      // When rateio is enabled, promote the category with the highest value
      // to be the primary `category` and adjust the persisted allocations.
      let finalCategory = data.category;
      let finalAllocations: Allocation[] | null = null;
      if (splitEnabled && allocations.length > 0) {
        const norm = normalizePrimary(data.category, data.amount, allocations);
        finalCategory = norm.primary;
        finalAllocations = norm.secondaries.length > 0 ? norm.secondaries : null;
      }

      const payload = {
        description: data.description,
        amount: data.amount,
        cost_center: data.cost_center,
        company: data.company,
        category: finalCategory,
        supplier: data.supplier,
        request_date: data.request_date,
        due_date: data.due_date || undefined,
        payment_method: data.payment_method,
        pix_key: data.pix_key,
        bank_name: data.bank_name,
        bank_agency: data.bank_agency,
        bank_account: data.bank_account,
        bank_account_type: data.bank_account_type,
        boleto_url,
        receipt_url,
        supplier_id: supplier_id || undefined,
        notes: data.notes,
        allocations: finalAllocations,
      };

      if (isEditing && editId) {
        update.mutate({ id: editId, ...payload } as any, { onSuccess: () => navigate('/financial/requests') });
      } else {
        create.mutate(payload, {
          onSuccess: async () => {
            const nfId = searchParams.get('nf_id');
            if (isFromNf && nfId) {
              await supabase.from('nf_uploads').update({ status: 'vinculado' }).eq('id', nfId);
            }
            navigate('/financial/requests');
          },
        });
      }
    } catch (err: any) {
      toast.error('Erro ao enviar arquivo: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const FileUploadZone = ({ file, onRemove, inputRef, onClickUpload, label, accept }: {
    file: File | null; onRemove: () => void; inputRef: React.RefObject<HTMLInputElement>;
    onClickUpload: () => void; label: string; accept: string;
  }) => (
    <>
      {!file ? (
        <div onClick={onClickUpload} className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          "hover:border-primary/50 hover:bg-primary/5 border-muted-foreground/20"
        )}>
          <Upload className="h-6 w-6 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">{accept} • Máx 50MB</p>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground truncate max-w-[280px]">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{isEditing ? 'Editar Solicitação de Pagamento' : 'Nova Solicitação de Pagamento'}</h1>
        <p className="text-sm text-muted-foreground mt-1">Preencha os dados do pagamento e do fornecedor</p>
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl><Input placeholder="Ex: Pagamento de serviço de limpeza" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl><CurrencyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="request_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="supplier" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <FormControl>
                      <SupplierAutocomplete
                        value={field.value || ''}
                        onChange={(name) => { field.onChange(name); setSelectedSupplierId(null); }}
                        onSelectSupplier={handleSelectSupplier}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              {selectedSupplierId && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs border-primary/30 bg-primary/5">
                    <CheckCircle2 className="h-3 w-3" />
                    Fornecedor reconhecido — dados de pagamento preenchidos
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 2: Classification */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Tag className="h-4 w-4" />
                Classificação
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField control={form.control} name="company" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa Contratante</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Selecione a empresa" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {FINANCIAL_COMPANIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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

          {/* Section 3: Payment Method */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <CreditCard className="h-4 w-4" />
                Forma de Pagamento
              </div>

              <FormField control={form.control} name="payment_method" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="grid grid-cols-3 gap-3">
                      {PAYMENT_METHODS.map(pm => {
                        const Icon = pm.icon;
                        const selected = field.value === pm.value;
                        return (
                          <button
                            key={pm.value}
                            type="button"
                            onClick={() => field.onChange(pm.value)}
                            className={cn(
                              "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                              selected
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-muted hover:border-muted-foreground/30"
                            )}
                          >
                            <Icon className={cn("h-6 w-6", selected ? "text-primary" : "text-muted-foreground")} />
                            <span className={cn("text-sm font-medium", selected ? "text-primary" : "text-muted-foreground")}>{pm.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Boleto fields */}
              {paymentMethod === 'boleto' && (
                <div className="space-y-4 pt-2 border-t">
                  <FormField control={form.control} name="due_date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Vencimento</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Input type="date" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div>
                    <p className="text-sm font-medium mb-2">Boleto (PDF)</p>
                    <input type="file" ref={boletoInputRef} onChange={handleFileChange(setBoletoFile)} accept=".pdf" className="hidden" />
                    {!boletoFile && existingBoletoUrl ? (
                      <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Boleto anexado</p>
                            <a href={existingBoletoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Visualizar arquivo</a>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => boletoInputRef.current?.click()}>Substituir</Button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => setExistingBoletoUrl(null)}><X className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ) : (
                      <FileUploadZone
                        file={boletoFile}
                        onRemove={() => { setBoletoFile(null); if (boletoInputRef.current) boletoInputRef.current.value = ''; }}
                        inputRef={boletoInputRef}
                        onClickUpload={() => boletoInputRef.current?.click()}
                        label="Clique para anexar o boleto"
                        accept="PDF"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* PIX fields */}
              {paymentMethod === 'pix' && (
                <div className="space-y-4 pt-2 border-t">
                  <FormField control={form.control} name="pix_key" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave PIX</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Input placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}

              {/* Transfer fields */}
              {paymentMethod === 'transferencia' && (
                <div className="space-y-4 pt-2 border-t">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="bank_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banco</FormLabel>
                        <FormControl><Input placeholder="Ex: Banco do Brasil" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="bank_account_type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Conta</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value || 'corrente'}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="corrente">Conta Corrente</SelectItem>
                              <SelectItem value="poupanca">Poupança</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="bank_agency" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agência</FormLabel>
                        <FormControl><Input placeholder="0001" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="bank_account" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta</FormLabel>
                        <FormControl><Input placeholder="12345-6" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 4: NF / Receipt */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Upload className="h-4 w-4" />
                Nota Fiscal / Comprovante
              </div>
              <input type="file" ref={receiptInputRef} onChange={handleFileChange(setReceiptFile)} accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" />
              {!receiptFile && existingReceiptUrl ? (
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">NF / Comprovante anexado</p>
                      <a href={existingReceiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Visualizar arquivo</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => receiptInputRef.current?.click()}>Substituir</Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setExistingReceiptUrl(null)}><X className="h-4 w-4" /></Button>
                  </div>
                </div>
              ) : (
                <>
                  <FileUploadZone
                    file={receiptFile}
                    onRemove={() => { setReceiptFile(null); if (receiptInputRef.current) receiptInputRef.current.value = ''; }}
                    inputRef={receiptInputRef}
                    onClickUpload={() => receiptInputRef.current?.click()}
                    label="Clique para anexar a NF ou comprovante"
                    accept="PDF, JPG ou PNG"
                  />
                  {!receiptFile && (
                    <div className="flex items-start gap-2 rounded-md bg-yellow-500/10 border border-yellow-500/20 p-3">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">
                        Sem NF anexada. A solicitação ficará marcada como <strong>pendente de NF</strong> e você poderá anexar depois.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Section 5: Notes */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl><Textarea placeholder="Informações adicionais..." rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end sticky bottom-4">
            <Button type="button" variant="outline" size="lg" onClick={() => navigate('/financial/requests')}>
              Cancelar
            </Button>
            <Button type="submit" size="lg" disabled={create.isPending || update.isPending || uploading}>
              {create.isPending || update.isPending || uploading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Solicitação'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
