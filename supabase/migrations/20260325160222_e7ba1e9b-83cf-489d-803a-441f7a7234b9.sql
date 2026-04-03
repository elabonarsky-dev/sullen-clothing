UPDATE artist_profiles SET
  stored_portrait_url = 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/artist-portraits/novat-hernandez-new.jpeg',
  location = 'Mexico, México, MX',
  studio = 'profetas',
  interview = '[
    {"question":"How did lettering find you — or did you find it?","answer":"Yo encontré el lettering por medio de revistas, de videos y tatuadores de Estados Unidos"},
    {"question":"Lettering is all about balance and flow, what do you think about when designing lettering for people to achieve the best outcome?","answer":"Principalmente pienso en cada cliente, en el para qué me lo pide, para qué lo van a ocupar, cómo lo van a usar, el tipo de marca, el tipo de cliente que me lo está pidiendo, para saber qué tan, qué tanto grado de dificultad le voy a poner a mi diseño, si va a ser más legible, si va a ser más grotesco, más saturado"},
    {"question":"What''s the hardest part of tattooing lettering?","answer":"Como tal, no creo que haya una parte difícil de tatuar letras, sino tal vez encajar bien con tu cliente, que los dos tengan la misma idea, coordinen y pues eso hace que fluya mejor el diseño"},
    {"question":"Walk us through your process for designing this hat — where did it start and what decisions surprised you along the way?","answer":"Para hacer la colaboración con Thule fue algo que principalmente no me esperaba. Cuando recibí el mensaje me emocioné demasiado, le conté a mis amigos del proyecto y empecé a trabajar en el diseño, ya que es una marca que te da mucha versatilidad en cuanto al diseño, te da mucha libertad, puedes hacer letras grotescas, pesadas y fue una experiencia bastante buena. Sí, me gustó mucho colaborar con ustedes."},
    {"question":"When a client sits down and says \"just make it look good\" — what are you actually solving for?","answer":"Cuando un cliente me dice que tengo la libertad creativa, se siente bastante bien, ya que te están dejando todo en tus manos porque les gusta tu estilo, les gusta lo que tú haces, lo que tú creas y eso está bastante bien, porque pues te da mucha libertad en cuanto a su diseño. Tienes más fluidez y puedes adaptar mejor el diseño para tu persona"},
    {"question":"Which tattoo lettering artists — past or present — are you inspired by?","answer":"Mis inspiraciones principalmente es Mr. Flax, Vagabond Revolts, Edgy Letters, Christelle Forded, Porkman. Son tatuadores que principalmente me motivan a las letras"},
    {"question":"What''s the difference between lettering that photographs well and lettering that holds on skin for 20 years?","answer":"El soporte, ya que un papel, pues es diferente a una piel. Una piel toma diferentes posiciones, diferentes texturas. En una piel el tatuaje se ve muchísimo diferente a un papel. Entonces, pues yo prefiero en la piel, porque en la piel envejece. Es una obra que llevas contigo siempre"},
    {"question":"What does it mean to you that your lettering work lives on a Sullen piece — outside the skin?","answer":"Para mí es un logro, ya que desde pequeño y desde que inicié en el mundo del tatuaje, Sullen siempre ha sido una marca muy posicionada y representativa para mí. Y el hecho de que la marca me haya buscado para que yo hiciera unas letras para ustedes fue algo demasiado sorprendente, muy gratificante y algo de lo que me siento orgulloso, emocionado y pues muy contento de esta colaboración con el sombrero"}
  ]'::jsonb,
  gallery_images = ARRAY[
    'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/artist-portraits/novat-hernandez-gallery-1.jpeg',
    'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/artist-portraits/novat-hernandez-gallery-2.jpeg',
    'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/artist-portraits/novat-hernandez-gallery-3.jpeg',
    'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/artist-portraits/novat-hernandez-gallery-4.jpeg',
    'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/artist-portraits/novat-hernandez-gallery-5.jpeg'
  ],
  updated_at = now()
WHERE slug = 'novat';