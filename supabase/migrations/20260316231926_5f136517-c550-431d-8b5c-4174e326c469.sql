
-- Create timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'BH-Matriz',
  min_stock INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Anyone can insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete products" ON public.products FOR DELETE USING (true);

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Collaborators table
CREATE TABLE public.collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'BH-Matriz',
  department TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read collaborators" ON public.collaborators FOR SELECT USING (true);
CREATE POLICY "Anyone can insert collaborators" ON public.collaborators FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update collaborators" ON public.collaborators FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete collaborators" ON public.collaborators FOR DELETE USING (true);

CREATE TRIGGER update_collaborators_updated_at BEFORE UPDATE ON public.collaborators
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Stock movements table
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida', 'ajuste')),
  quantity INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  "user" TEXT NOT NULL DEFAULT 'Admin',
  responsible TEXT,
  notes TEXT,
  unit TEXT NOT NULL DEFAULT 'BH-Matriz',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read movements" ON public.stock_movements FOR SELECT USING (true);
CREATE POLICY "Anyone can insert movements" ON public.stock_movements FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete movements" ON public.stock_movements FOR DELETE USING (true);

-- Assets table
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  branch TEXT NOT NULL,
  acquisition_date DATE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read assets" ON public.assets FOR SELECT USING (true);
CREATE POLICY "Anyone can insert assets" ON public.assets FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update assets" ON public.assets FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete assets" ON public.assets FOR DELETE USING (true);

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- NF uploads table
CREATE TABLE public.nf_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  supplier TEXT,
  total_value NUMERIC(12,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nf_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read nf_uploads" ON public.nf_uploads FOR SELECT USING (true);
CREATE POLICY "Anyone can insert nf_uploads" ON public.nf_uploads FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update nf_uploads" ON public.nf_uploads FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete nf_uploads" ON public.nf_uploads FOR DELETE USING (true);

CREATE TRIGGER update_nf_uploads_updated_at BEFORE UPDATE ON public.nf_uploads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- NF items table
CREATE TABLE public.nf_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nf_upload_id UUID REFERENCES public.nf_uploads(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0
);

ALTER TABLE public.nf_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read nf_items" ON public.nf_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert nf_items" ON public.nf_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete nf_items" ON public.nf_items FOR DELETE USING (true);

-- Trigger to auto-update product quantity on movement insert
CREATE OR REPLACE FUNCTION public.update_product_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'entrada' THEN
    UPDATE public.products SET quantity = quantity + NEW.quantity, total_price = (quantity + NEW.quantity) * unit_price WHERE id = NEW.product_id;
  ELSIF NEW.type = 'saida' THEN
    UPDATE public.products SET quantity = GREATEST(0, quantity - NEW.quantity), total_price = GREATEST(0, quantity - NEW.quantity) * unit_price WHERE id = NEW.product_id;
  ELSIF NEW.type = 'ajuste' THEN
    UPDATE public.products SET quantity = NEW.quantity, total_price = NEW.quantity * unit_price WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_movement_insert
AFTER INSERT ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.update_product_quantity();
