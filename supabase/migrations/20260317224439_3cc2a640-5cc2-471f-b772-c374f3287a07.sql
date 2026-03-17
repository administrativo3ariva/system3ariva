-- Allow update and delete on stock_movements
CREATE POLICY "Anyone can update movements" ON public.stock_movements FOR UPDATE TO public USING (true);

-- Update trigger to handle UPDATE and DELETE for product quantity recalculation
CREATE OR REPLACE FUNCTION public.update_product_quantity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.type = 'entrada' THEN
      UPDATE public.products SET quantity = GREATEST(0, quantity - OLD.quantity), total_price = GREATEST(0, quantity - OLD.quantity) * unit_price WHERE id = OLD.product_id;
    ELSIF OLD.type = 'saida' THEN
      UPDATE public.products SET quantity = quantity + OLD.quantity, total_price = (quantity + OLD.quantity) * unit_price WHERE id = OLD.product_id;
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Reverse old movement
    IF OLD.type = 'entrada' THEN
      UPDATE public.products SET quantity = GREATEST(0, quantity - OLD.quantity), total_price = GREATEST(0, quantity - OLD.quantity) * unit_price WHERE id = OLD.product_id;
    ELSIF OLD.type = 'saida' THEN
      UPDATE public.products SET quantity = quantity + OLD.quantity, total_price = (quantity + OLD.quantity) * unit_price WHERE id = OLD.product_id;
    ELSIF OLD.type = 'ajuste' THEN
      -- Can't easily reverse ajuste, skip
      NULL;
    END IF;
  END IF;

  -- Apply new movement (INSERT or UPDATE)
  IF NEW.type = 'entrada' THEN
    UPDATE public.products SET quantity = quantity + NEW.quantity, total_price = (quantity + NEW.quantity) * unit_price WHERE id = NEW.product_id;
  ELSIF NEW.type = 'saida' THEN
    UPDATE public.products SET quantity = GREATEST(0, quantity - NEW.quantity), total_price = GREATEST(0, quantity - NEW.quantity) * unit_price WHERE id = NEW.product_id;
  ELSIF NEW.type = 'ajuste' THEN
    UPDATE public.products SET quantity = NEW.quantity, total_price = NEW.quantity * unit_price WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Recreate trigger for INSERT, UPDATE, DELETE
DROP TRIGGER IF EXISTS trg_update_product_quantity ON public.stock_movements;
CREATE TRIGGER trg_update_product_quantity
AFTER INSERT OR UPDATE OR DELETE ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.update_product_quantity();