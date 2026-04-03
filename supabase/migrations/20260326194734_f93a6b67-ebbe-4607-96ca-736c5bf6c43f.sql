-- Set stored_portrait_url for novat-hernandez and pepelini-nunez (re-hosted from interview app)
UPDATE artist_profiles SET stored_portrait_url = 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/artist-portraits/novat-hernandez.jpg' WHERE slug = 'novat-hernandez';
UPDATE artist_profiles SET stored_portrait_url = 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/artist-portraits/pepelini-nunez.jpg' WHERE slug = 'pepelini-nunez';

-- Clear broken portrait_url for 5 artists whose Shopify CDN images are 404
UPDATE artist_profiles SET portrait_url = NULL WHERE slug IN ('josh-carlton','hans-florentino','josh-payne','siebert-reese','shawn-barber-1') AND stored_portrait_url IS NULL;