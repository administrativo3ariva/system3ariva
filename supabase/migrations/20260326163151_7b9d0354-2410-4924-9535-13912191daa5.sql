
CREATE TABLE public.maintenance_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  branch TEXT NOT NULL DEFAULT 'BH-Matriz',
  floor TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'media',
  due_date DATE,
  completed_date DATE,
  recurrence_months INTEGER,
  supplier TEXT,
  estimated_cost NUMERIC DEFAULT 0,
  actual_cost NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read maintenance_tasks" ON public.maintenance_tasks FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert maintenance_tasks" ON public.maintenance_tasks FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update maintenance_tasks" ON public.maintenance_tasks FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete maintenance_tasks" ON public.maintenance_tasks FOR DELETE TO public USING (true);
