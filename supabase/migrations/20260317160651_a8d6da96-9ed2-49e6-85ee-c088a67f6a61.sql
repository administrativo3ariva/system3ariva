CREATE TRIGGER trg_update_product_quantity
AFTER INSERT ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.update_product_quantity();