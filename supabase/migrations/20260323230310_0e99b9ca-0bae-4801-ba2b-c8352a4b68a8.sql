ALTER TABLE public.color_swatches
  ADD COLUMN stroke_color text DEFAULT NULL,
  ADD COLUMN is_split boolean NOT NULL DEFAULT false,
  ADD COLUMN split_color_1 text DEFAULT NULL,
  ADD COLUMN split_color_2 text DEFAULT NULL;