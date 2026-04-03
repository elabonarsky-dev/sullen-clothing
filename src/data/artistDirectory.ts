import { RAW_FINDER_ARTISTS, deriveLocation, slugify } from "./artistFinderData";
import lastlyPortrait from "@/assets/lastly-tattooer-portrait.jpg";
import { shopifyImg } from "@/lib/utils";

export interface DirectoryArtist {
  name: string;
  slug: string;
  portrait: string;
  specialty?: string;
  styles?: string[];
  location?: string;
  region?: string;
  instagram?: string;
  featured?: boolean;
  bio: string;
  fullBio?: string;
  blogUrl: string;
  galleryImages?: string[];
  studio?: string;
  bookingInfo?: string;
  rating?: number;
  pieces?: number;
}

/* ── Curated artists with rich editorial data ── */
const CURATED: DirectoryArtist[] = [
  {
    name: "Guizo",
    slug: "guizo",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/Screenshot_2026-03-15_at_11.37.33_AM.png?v=1773600602",
    specialty: "Script & Lettering",
    styles: ["Lettering", "Chicano"],
    location: "Lisbon, Portugal",
    region: "Europe",
    instagram: "@guizo187",
    featured: true,
    bio: "GUIZO is Lisbon's lettering king and a true Sullen family original. Operating from Dilúvio Tattoo Studio, his signature bold blackletter and Chicano-influenced script tattooing is immediately recognizable.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/guizo",
    studio: "Dilúvio Tattoo Studio",
    bookingInfo: "DM via Instagram or visit linktr.ee/guizo187",
    galleryImages: [
      "https://www.sullenclothing.com/cdn/shop/articles/Screenshot_2026-03-15_at_11.37.33_AM.png?v=1773600602&width=1264",
    ],
  },
  {
    name: "Cleo Kinnaman",
    slug: "cleo-kinnaman",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/cleo_kinnaman.jpg?v=1773600777",
    specialty: "Black & Grey Realism",
    styles: ["Realism", "Black & Grey"],
    location: "Stockholm, Sweden",
    region: "Europe",
    instagram: "@cleokinnaman",
    featured: true,
    bio: "Some artists make tattoos. Cleo Kinnaman makes portraits that happen to live on skin. Born in Belgium to a Swedish mother and Ethiopian father, her nomadic upbringing gave her a visual vocabulary built across cultures. Her subjects are rendered in soft, layered black and grey with the kind of emotional weight you'd expect from a fine art gallery.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/cleo-kinnaman-the-swedish-ethiopian-artist-who-made-black-grey-a-global-language",
  },
  {
    name: "Zach Goldin",
    slug: "zach-goldin",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/portrait-1773120249805-2025-may-21-Zach-1.jpg?v=1773272693",
    specialty: "Black & Grey Realism",
    styles: ["Realism", "Black & Grey"],
    location: "Vaughan, ON, Canada",
    region: "International",
    instagram: "@goldin.misfits",
    featured: true,
    bio: "Zach Goldin's work sits firmly in the world of black and grey realism, but with a darker edge. His tattoos lean heavily into contrast, shadow, and imagery that carries a certain weight — life growing from death, growth coming from struggle.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/zach-goldin",
    studio: "Misfits Tattoo Studio",
    galleryImages: [
      "https://cdn.arenacommerce.com/sullenclothing/artwork-1773120258273-IMG_6333.jpeg",
      "https://cdn.arenacommerce.com/sullenclothing/artwork-1773120254001-IMG_5305.jpeg",
    ],
  },
  {
    name: "Rafa Lobo",
    slug: "rafa-lobo",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/Screenshot_2026-03-06_at_9.08.48_PM.png?v=1772860162",
    specialty: "Neo-Traditional",
    styles: ["Neo-Trad", "Illustrative"],
    location: "Brazil",
    region: "International",
    instagram: "@rafalobo_tattoo",
    bio: "Rafa Lobo runs a private studio in Brazil — every client is there intentionally, every piece gets the full weight of his attention. Tigers, eagles, and wolves dominate his feed — vibrating with electric color.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/rafa-lobo",
  },
  {
    name: "Sulu'ape RiccyBoy",
    slug: "suluape-riccyboy",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_17_3add5193-e2f7-4f5c-ba1a-538d9821b604.jpg?v=1772859494",
    specialty: "Traditional Samoan Tatau",
    styles: ["Traditional"],
    instagram: "@suluape_riccyboy",
    featured: true,
    bio: "The Sulu'ape name traces back to the most revered family in Samoan tattooing — keepers of the pe'a and the malu, full-body tattoos that have defined Samoan cultural identity for over two thousand years. RiccyBoy practices traditional hand-tap tatau.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/suluape-riccyboy",
  },
  {
    name: "Preston Chambers",
    slug: "preston-chambers",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_18_6ccb5d41-c2b6-4dd0-911c-89fa6bbc601a.jpg?v=1772859200",
    specialty: "Realism",
    styles: ["Realism", "Lettering", "Neo-Trad"],
    instagram: "@prestonchamberstattoo",
    bio: "Tattooer, Painter, Drawer, Lover of Words. Preston Chambers does the opposite of specializing — and does it better than most specialists do their one thing. His hand-lettering and calligraphy work stands on its own as fine art, while his portraiture and neo-traditional pieces showcase a mastery of color and composition.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/preston-chambers",
    studio: "Rebellion Tattoo",
  },
  {
    name: "André Rodrigues",
    slug: "andre-rodrigues",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_35_cdfc9657-bd9b-4d33-8388-c84a242cb904.jpg?v=1772856860",
    specialty: "Neo-Traditional",
    styles: ["Neo-Trad", "Illustrative"],
    location: "São Paulo, Brazil",
    region: "International",
    instagram: "@donrodrigues",
    bio: "Known globally as Don Rodrigues, André is one of São Paulo's most accomplished neo-traditional artists. His practice spans tattoo, watercolor, charcoal drawing, oil painting, and digital illustration — a multi-disciplinary foundation that shows up directly in his work.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/andre-rodrigues",
  },
  {
    name: "Pavlik Gusarov",
    slug: "pavlik-gusarov",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_19_0db312f3-5640-4826-a570-c9cc782e74f7.jpg?v=1772856662",
    specialty: "Blackwork",
    styles: ["Blackwork", "Illustrative"],
    location: "Saint Petersburg, Russia",
    region: "Europe",
    instagram: "@gusarov_tattoo",
    bio: "Out of Saint Petersburg comes one of the most visually arresting blackwork practitioners in the European tattoo underground. Pavel Gusarov has built a body of work centered on what he calls Звериный стиль — Beast Style. Bold, dark, and committed — no half measures.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/pavlik-gusarov",
  },
  {
    name: "Paul Andi Bocu",
    slug: "paul-andi-bocu",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_20_d9480c12-4a77-445f-a6f1-137c05ec15e5.jpg?v=1772856616",
    specialty: "Black & Grey",
    styles: ["Realism", "Black & Grey"],
    location: "Italy",
    region: "Europe",
    instagram: "@pavlocapoeira",
    bio: "Paul Andi Bocu has been doing this since 2002 — over two decades of needle and brush, studying light and form. Operating out of Positive Temptation Tattoo Studio in Italy, his work carries the unmistakable weight of someone who approaches tattooing the way a classical painter approaches canvas.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/paul-andi-bocu",
    studio: "Positive Temptation Tattoo Studio",
  },
  {
    name: "Mike Suarez",
    slug: "mike-suarez",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_22_748599af-79b5-45cb-98d9-92468db89aef.jpg?v=1772869877",
    specialty: "Illustrative",
    styles: ["Illustrative", "Realism", "Neo-Trad"],
    location: "Bay Area / Los Angeles, CA",
    region: "California",
    instagram: "@mikesuareztattoo",
    bio: "The road artist. Bay Area, Los Angeles, Europe — ON THE ROAD. All styles served. Mike Suarez builds a following city by city, convention by convention. His versatility, professionalism, and consistent quality have earned him bookings across continents.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/mike-suarez",
  },
  {
    name: "Meng Yao",
    slug: "meng-yao",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_23_dfcb12f3-682e-4e6f-8746-b532284cfa4d.jpg?v=1772856519",
    specialty: "Japanese",
    styles: ["Japanese", "Illustrative"],
    location: "Alhambra, CA",
    region: "California",
    instagram: "@mengyao_tattoo",
    bio: "Also known as Man Yao 彫光, Meng is one of SoCal's most sought-after artists and a proud member of the legendary Jess Yen Family. Working out of My Tattoo and Piercing in Alhambra, his books are open for mid-2027 and beyond — the natural consequence of work so distinctive clients plan their lives around it.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/meng-yao",
    studio: "My Tattoo and Piercing",
  },
  {
    name: "Mads Thill",
    slug: "mads-thill",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_24_2f045d01-e21d-4cc7-84b6-032a87dd2e1d.jpg?v=1772856474",
    specialty: "Black & Grey",
    styles: ["Black & Grey", "Blackwork"],
    location: "San Diego / NYC / Denmark",
    region: "US - Other",
    instagram: "@madsthill",
    bio: "Mads Hill operates across three time zones and two continents — San Diego, New York City, and Roskilde, Denmark. Deeply intricate, cinematic black and grey work that feels like it was carved rather than tattooed. A precision and restraint that feels distinctly Nordic, fused with the bold visual ambition of the American tattoo scene.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/mads-thill",
  },
  {
    name: "Henri Buro Riton",
    slug: "henri-buro-riton",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_25_61569ab0-36a5-4f59-90e0-d11ca9f4ae9f.jpg?v=1772856428",
    specialty: "Traditional",
    instagram: "@henri_buro_riton",
    styles: ["Traditional", "Neo-Trad"],
    region: "Europe",
    bio: "Henri Buro Riton is a practitioner of traditional tattooing in its purest form. Bold lines, solid fills, and timeless compositions — his work honors the foundations of the craft while bringing a contemporary energy that keeps it vital.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/henri-buro-riton",
  },
  {
    name: "Eva Jean",
    slug: "eva-jean",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_26_c37de5b3-edca-4599-aba5-5195f3f9625b.jpg?v=1772856366",
    specialty: "Illustrative Traditional",
    styles: ["Neo-Trad", "Illustrative"],
    location: "Buffalo, NY",
    region: "US - Other",
    instagram: "@evajeantattoos",
    featured: true,
    bio: "Eva Jean Huber has been tattooing since 2004 — two decades of custom work from Buffalo, New York. Working from her private studio The Rehn Haus, her illustrative traditional style mixes classical craftsmanship with a personal, almost storybook quality.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/eva-jean",
    studio: "The Rehn Haus",
    bookingInfo: "Tattoosbyeva@gmail.com",
  },
  {
    name: "Eric Smith",
    slug: "eric-smith",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_27.jpg?v=1772856314",
    specialty: "Realism",
    instagram: "@onesix_art",
    styles: ["Realism", "Black & Grey"],
    bio: "Eric Smith is a realism specialist whose portraits carry an emotional depth that goes beyond photographic reproduction. Every piece tells a story, rendered with patience and precision that reflects years of dedicated practice.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/eric-smith",
  },
  {
    name: "Eddy Giordano",
    slug: "eddy-giordano",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_28_4b2d6c76-6aa4-4af4-89f2-0946d8fa90b8.jpg?v=1772856273",
    specialty: "Neo-Traditional",
    instagram: "@tintasanta_tattoo",
    styles: ["Neo-Trad", "Illustrative"],
    bio: "Eddy Giordano's neo-traditional work pulses with a vitality that makes every piece feel alive. His color palettes are rich and intentional, his compositions are dynamic, and his line confidence is unmistakable.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/eddy-giordano",
  },
  {
    name: "Devin Bennett",
    slug: "devin-bennett",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_29_055a485b-eb6b-4488-bd05-5104e07e94be.jpg?v=1772856212",
    specialty: "Dark Realism",
    instagram: "@d_fect",
    styles: ["Realism", "Black & Grey"],
    bio: "Devin Bennett specializes in dark realism that walks the line between beauty and horror. His pieces are atmospheric, moody, and technically impeccable — the kind of work that stops you mid-scroll and demands a closer look.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/devin-bennett",
  },
  {
    name: "Delia Brody",
    slug: "delia-brody",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_30_b161490e-489a-4189-b3a4-f97f5b55cf00.jpg?v=1772856167",
    specialty: "Illustrative",
    instagram: "@deliabrodytattoo",
    styles: ["Illustrative", "Neo-Trad"],
    bio: "Delia Brody brings a distinct illustrative voice to the Sullen collective. Her work blends feminine strength with dark beauty, creating pieces that feel both delicate and powerful — a duality that runs through everything she creates.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/delia-brody-1",
  },
  {
    name: "Brandon Herrera",
    slug: "brandon-herrera",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_31_a5f770f2-a666-48a9-83b4-8da06c650887.jpg?v=1772856138",
    specialty: "Chicano",
    instagram: "@brandon__herrera",
    styles: ["Chicano", "Black & Grey", "Lettering"],
    bio: "Brandon Herrera is rooted in the Chicano tattoo tradition — bold lettering, religious iconography, and portraits that carry the weight of culture and community. His work is a bridge between heritage and personal expression.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/brandon-herrera",
  },
  {
    name: "Brian Ulibarri",
    slug: "brian-ulibarri",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_32_3c142559-3fa1-4016-a45e-3ccc7d760eda.jpg?v=1772856069",
    specialty: "Color Realism",
    instagram: "@brian_ulibarri",
    styles: ["Realism", "Color Realism"],
    bio: "Brian Ulibarri is a color realism master whose work explodes with vibrancy while maintaining photographic precision. His ability to capture light, texture, and emotion in full color sets him apart.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/brian-ulibarri",
  },
  {
    name: "Ben Osrowitz",
    slug: "ben-osrowitz",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_33_2d4fb4c5-54ef-4665-9db0-c744ca2d74c3.jpg?v=1772856018",
    specialty: "Neo-Traditional",
    styles: ["Neo-Trad", "Illustrative", "Japanese"],
    location: "Lake Worth, FL",
    region: "US - Other",
    instagram: "@benoz_tattoo",
    bio: "Ben Oz built a universe. Based out of Lake Worth, Florida, the owner of Twisted Tuna Tattoo has spent years developing work that sits at the intersection of dark neo-traditional, neo-Japanese, and illustrative tattooing — imagery pulled from a fever dream and made permanent.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/ben-osrowitz",
    studio: "Twisted Tuna Tattoo",
  },
  {
    name: "Ben Corn",
    slug: "ben-corn",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_34_e121ae2d-dadf-4af9-9af6-033fa4f612df.jpg?v=1772855945",
    specialty: "Realism",
    instagram: "@bencorntattoos",
    styles: ["Realism", "Black & Grey"],
    bio: "Ben Corn brings technical excellence to every piece, with a focus on black and grey realism that captures emotion and atmosphere in equal measure.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/ben-corn",
  },
  {
    name: "Norm",
    slug: "norm",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_21_f1c1f443-dd34-472f-ad37-35dd45ca0730.jpg?v=1772855829",
    specialty: "Lettering",
    styles: ["Lettering", "Chicano"],
    instagram: "@normloveletters",
    featured: true,
    bio: "In Loving Memory (1974–2019). Tattoo artist, graffiti writer, coil machine builder, cultural pillar. Norm's graffiti roots gave his tattoo work a visual DNA that was entirely self-generated — flowing scripts, love letter aesthetics, Chicano-influenced lettering that carried the weight of the streets.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/norm",
  },
  {
    name: "Ryan Thomas",
    slug: "ryan-thomas",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_15_de8c0baf-3ea7-47d4-bb2a-2fb82ba2479f.jpg?v=1772855684",
    specialty: "Realism",
    instagram: "@ryanthomasb13",
    styles: ["Realism", "Black & Grey"],
    bio: "Ryan Thomas brings a cinematic approach to realism, with deep contrast and atmospheric compositions that command attention.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/ryan-thomas",
  },
  {
    name: "Sonny Francoeur",
    slug: "sonny-francoeur",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_14_346ea8df-de8e-4e94-a430-86dcdcfea9b4.jpg?v=1772855597",
    specialty: "Realism",
    instagram: "@sonnyfrancoeur",
    styles: ["Realism", "Color Realism"],
    bio: "Sonny Francoeur delivers vivid color realism with emotional depth and technical precision that sets his work apart.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/sonny-francoeur",
  },
  {
    name: "Stéphane Chaudesaigues",
    slug: "stephane-chaudesaigues",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/image_13_b12964a3-3560-45f2-ac9b-5cf71004abc6.jpg?v=1772855497",
    specialty: "Realism",
    instagram: "@chaudesaigues_tatouage",
    styles: ["Realism", "Color Realism"],
    region: "Europe",
    location: "France",
    bio: "Stéphane Chaudesaigues is a French realism master known for hyper-detailed color work that pushes the boundaries of what's possible on skin.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/stephane-chaudesaigues",
  },
  {
    name: "Ben Harper",
    slug: "ben-harper",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/portrait-1773074361595-98F6370A-09D5-4D01-BBAE-06A695F64BBB.jpg?v=1773272954",
    specialty: "Japanese",
    styles: ["Japanese", "Illustrative"],
    location: "Basildon, Essex, UK",
    region: "Europe",
    instagram: "@bharpertattoo",
    bio: "Essex-based Japanese tattooing done the right way. Ben works out of Violet Rose Tattoo, bringing irezumi tradition to the UK with discipline and reverence.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/ben-harper",
    studio: "Violet Rose Tattoo",
    galleryImages: [
      "https://cdn.arenacommerce.com/sullenclothing/artwork-1773074366439-IMG_7743.jpeg",
      "https://cdn.arenacommerce.com/sullenclothing/artwork-1773074368452-IMG_8189.jpeg",
    ],
  },
  {
    name: "Rick Trip",
    slug: "rick-trip",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/Rick-Trip-Tattoo-Artist-Las-Vegas-Nevada-Trip-Ink-Tattoo_2589c38d-ed49-492b-bb6f-738232372990.jpg?v=1772839908",
    specialty: "Realism",
    styles: ["Realism", "Color Realism", "Traditional"],
    location: "Las Vegas, NV",
    region: "US - Other",
    instagram: "@ricktriptattoo",
    bio: "Owner of Trip Ink Tattoo Company in Las Vegas. Rick Trip didn't start behind a counter — he went to the world first on the convention circuit since 2007, then built a home base. One of the most genuinely versatile tattoo artists operating in the West today.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/rick-trip",
    studio: "Trip Ink Tattoo Company",
  },
  {
    name: "Vomit Vessel",
    slug: "vomit-vessel",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/Screenshot_2026-03-06_at_3.21.25_PM.png?v=1772839309",
    specialty: "Neo-Traditional",
    styles: ["Neo-Trad", "Traditional"],
    location: "Chile",
    region: "International",
    instagram: "@vomitvessel",
    bio: "Based in Chile and tattooing since 2011, Vomit Vessel has spent over a decade building one of the most distinctive voices in South American tattooing — a style rooted in Old School tradition but pushed into neo-traditional territory with bold outlines, rich saturated color, and imagery pulled from classic tattoo iconography.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/vomit-vessel",
  },
  {
    name: "Jon Nelson",
    slug: "jon-nelson",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/jonnelson.jpg?v=1772860727",
    specialty: "Realism",
    instagram: "@jonnelson_tattoos",
    styles: ["Realism", "Black & Grey"],
    bio: "Jon Nelson's dark realism carries a weight and atmospheric quality that makes every piece feel like a scene from a noir film.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/jon-nelson",
  },
  {
    name: "Fábio Guerreiro",
    slug: "fabio-guerreiro",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/Screenshot_2026-03-06_at_2.20.23_PM.png?v=1772835860",
    specialty: "Realism",
    instagram: "@fabio_tattooartist",
    styles: ["Realism", "Color Realism"],
    region: "International",
    bio: "Fábio Guerreiro brings vibrant color realism with emotional impact and technical mastery that resonates across cultures.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/fabio-guerreiro",
  },
  {
    name: "Nacho",
    slug: "nacho",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/Screenshot_2026-03-06_at_1.59.28_PM.png?v=1772834398",
    specialty: "Realism",
    instagram: "@nacho_ttt",
    styles: ["Realism", "Black & Grey"],
    bio: "Nacho delivers atmospheric realism with cinematic depth and raw emotional power in every piece.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/nacho",
  },
  {
    name: "Ruben Banez",
    slug: "ruben-banez",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/Screenshot_2026-03-06_at_1.52.33_PM.png?v=1772833972",
    specialty: "Realism",
    instagram: "@rubenbanez_",
    styles: ["Realism", "Color Realism"],
    bio: "Ruben Banez creates bold color realism with precision and a distinctive artistic vision that makes his work instantly recognizable.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/ruben-banez",
  },
  {
    name: "Kieren Maydew",
    slug: "kieren-maydew",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/Screenshot_2026-03-06_at_1.47.04_PM.png?v=1772833718",
    specialty: "Realism",
    instagram: "@kierenmaydew",
    styles: ["Realism", "Black & Grey"],
    bio: "Kieren Maydew's dark realism captures haunting beauty with technical excellence and atmospheric depth.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/kieren-maydew",
  },
  {
    name: "Joe Gentile",
    slug: "joe-gentile",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/Screenshot_2026-03-06_at_10.29.26_AM.png?v=1772833332",
    specialty: "Realism",
    instagram: "@joegentiletattoo",
    styles: ["Realism", "Color Realism"],
    bio: "Joe Gentile brings a painter's eye to color realism, creating vivid, emotionally charged tattoo art.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/joe-gentile",
  },
  {
    name: "Daniel Rhzz",
    slug: "daniel-rhzz",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/Screenshot_2026-03-06_at_9.50.25_AM.png?v=1772819485",
    specialty: "Realism",
    styles: ["Realism", "Black & Grey"],
    instagram: "@danielrhzz",
    bio: "Daniel Rhzz delivers powerful realism with deep contrast and emotional resonance in every composition.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/daniel-rhzz",
  },
  {
    name: "Jess \"Verdi\" Gonzalez",
    slug: "jess-verdi-gonzalez",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/Screenshot_2026-03-03_at_12.50.18_PM.png?v=1772571043",
    specialty: "Realism",
    styles: ["Realism", "Color Realism"],
    instagram: "@whitelandstattoo",
    bio: "Jess 'Verdi' Gonzalez brings vibrant color realism to the Sullen family, operating from Whitelands Tattoo with a distinctive artistic voice.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/jess-verdi-gonzalez",
    studio: "Whitelands Tattoo",
  },
  {
    name: "Miser86",
    slug: "miser86",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/Screenshot_2026-03-03_at_12.45.46_PM.png?v=1772570764",
    specialty: "Illustrative",
    styles: ["Illustrative", "Blackwork"],
    instagram: "@miser86",
    bio: "Miser86 creates dark illustrative work with a raw, uncompromising edge that commands attention.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/miser86",
  },
  {
    name: "Andrea Zorloni",
    slug: "andrea-zorloni",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/Screenshot_2026-03-03_at_11.49.23_AM.png?v=1772567437",
    specialty: "Realism",
    instagram: "@zorloniandrea",
    styles: ["Realism", "Color Realism"],
    region: "Europe",
    bio: "Andrea Zorloni brings European precision to color realism, with vivid palettes and incredible technical control.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/andrea-zorloni",
  },
  {
    name: "Heather Odist",
    slug: "heather-odist",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/HEATHER-ODIST.jpg?v=1772677653",
    specialty: "Illustrative",
    styles: ["Illustrative", "Neo-Trad"],
    instagram: "@heather_odist_tattoo",
    bio: "Heather Odist brings a bold illustrative voice with rich color and powerful feminine energy to every piece she creates.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/heather-odist",
  },
  {
    name: "Nathan Smith",
    slug: "nathan-smith",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/Screenshot_2026-03-03_at_10.56.44_AM.png?v=1772564241",
    specialty: "Realism",
    instagram: "@nathanssmith",
    styles: ["Realism", "Black & Grey"],
    bio: "Nathan Smith's black and grey realism captures haunting depth and emotional weight in every portrait and composition.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/nathan-smith",
  },
  {
    name: "Nekroz",
    slug: "nekroz",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/Screenshot_2026-03-03_at_10.48.12_AM.png?v=1772563715",
    specialty: "Blackwork",
    instagram: "@nekroz.wn",
    styles: ["Blackwork", "Illustrative"],
    bio: "Nekroz creates dark, atmospheric blackwork and illustrative pieces that feel like pages torn from a gothic manuscript.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/nekroz",
  },
  {
    name: "Kit Miller",
    slug: "kit-miller",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/Screenshot_2026-03-03_at_10.39.41_AM.png?v=1772563272",
    specialty: "Illustrative Blackwork",
    instagram: "@kit.creates",
    styles: ["Blackwork", "Illustrative", "Fine Line"],
    bio: "Kit Miller engineers custom pieces of art that perfectly complement anatomy. Specializing in highly detailed illustrative blackwork, Kit's designs are marked by flawless line weights, deep contrast, and a dark, surreal edge.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/kit-miller",
  },
  {
    name: "Yung Chavo",
    slug: "yung-chavo",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/Screenshot_2026-03-02_at_7.41.44_PM.png?v=1772515390",
    specialty: "Chicano",
    instagram: "@yung_chavo",
    styles: ["Chicano", "Black & Grey"],
    bio: "Yung Chavo channels Chicano tradition with fresh energy — bold lettering, cultural iconography, and smooth grey wash with street authenticity.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/yung-chavo",
  },
  {
    name: "Chris Edmondsom",
    slug: "chris-edmondsom",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/Screenshot_2026-03-02_at_7.36.07_PM.png?v=1772509701",
    specialty: "Realism",
    instagram: "@chrisedmondsontattoo",
    styles: ["Realism", "Black & Grey"],
    bio: "Chris Edmondsom delivers powerful black and grey realism with cinematic depth and emotional resonance.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/chris-edmondsom",
  },
  {
    name: "Feliz Lopez",
    slug: "feliz-lopez",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/Screenshot_2026-03-02_at_7.26.05_PM.png?v=1772513887",
    specialty: "Chicano",
    instagram: "@felixlops",
    styles: ["Chicano", "Black & Grey"],
    bio: "Feliz Lopez carries the Chicano tradition forward with bold execution, cultural depth, and smooth grey work that honors the lineage.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/feliz-lopez",
  },
  {
    name: "H.Black Ink",
    slug: "h-black-ink",
    portrait: "",
    specialty: "Blackwork",
    instagram: "@h.black_ink",
    styles: ["Blackwork", "Illustrative"],
    bio: "H.Black Ink is a blackwork tattoo artist whose bold, graphic style translates powerfully from skin to apparel.",
    blogUrl: "",
  },
  {
    name: "Lasty Tattooer",
    slug: "lastly-tattooer",
    portrait: lastlyPortrait,
    specialty: "Dark Gothic & Medieval",
    styles: ["Blackwork", "Illustrative"],
    location: "Los Angeles, CA",
    region: "California",
    instagram: "@lastytattooer",
    featured: true,
    bio: "Lasty Tattooer is a dark arts specialist whose work fuses medieval gothic imagery with modern tattoo technique. Known for intricate armor, weaponry, and warrior motifs, Lasty brings a cinematic depth to every piece.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/lastly-tattooer",
    galleryImages: [
      "https://www.sullenclothing.com/cdn/shop/files/lastly-tattooer-up-close-life.jpg?v=1773688404&width=1320",
      "https://www.sullenclothing.com/cdn/shop/files/lastly-tattooer-far-life.jpg?v=1773688404&width=1320",
    ],
  },
  {
    name: "Julian Farrar",
    slug: "julian-farrar",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/JULIAN-FARRAR.jpg?v=1729709757",
    specialty: "Illustrative & Neo-Trad",
    styles: ["Illustrative", "Neo-Trad"],
    location: "Stockholm, Sweden",
    region: "Europe",
    instagram: "@drawswhat1likes",
    featured: true,
    bio: "Julian Farrar, a prominent artist born in London in 1972, has made significant strides in the world of art with his diverse skills and creative endeavors. After completing his early education, Farrar honed his talents at the Wimbledon School of Art, where he cultivated his passion for figurative sculpture, drawing, and photography. Pursuing further studies, he attended Camberwell College of Art in 1995, focusing on Fine Art and Graphics. Over the years, Farrar has established a multifaceted career as a commissioning portrait artist, a jewelry maker, a prop creator for film and theater productions, and as an art and photography educator. His drawings have gained international recognition, being featured in the International Drawing Annuals and notable art publications like the American Artist Magazine, Drawing edition. Now residing in Stockholm, Sweden with his wife and two children, Julian Farrar continues to inspire with his artistry and profound impact on the contemporary art scene.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/julian-farrar",
    galleryImages: [
      "https://cdn.arenacommerce.com/sullenclothing/image%20-%202024-10-23T120320.788.jpg",
      "https://cdn.arenacommerce.com/sullenclothing/image%20-%202024-10-23T120355.618.jpg",
    ],
  },
  {
    name: "Shane Huss",
    slug: "shane-huss",
    portrait: "https://www.sullenclothing.com/cdn/shop/articles/Screenshot_2026-03-18_at_6.52.20_PM.png?v=1773885156",
    specialty: "Gothic Lettering & Calligraphy",
    styles: ["Lettering", "Blackletter", "Calligraphy", "Graffiti"],
    location: "United States",
    region: "US - Other",
    instagram: "@shanehuss",
    featured: true,
    bio: "Shane Huss creates immersive environments consumed by dense, architectural gothic lettering — pushing calligraphy and blackletter into the territory of installation art.",
    fullBio: "Shane Huss doesn't make tattoos. He makes rooms. Entire environments consumed by dense, architectural gothic lettering — floor to ceiling, wall to wall, black and silver, layered and interlocking, the letterforms pressing against each other like something trying to get out. At 114K followers and with a practice that has pushed calligraphy and blackletter into the territory of immersive installation art, Shane is one of the most distinctive voices in contemporary lettering, full stop.\n\nShane identifies as a Writer — the graffiti tradition's word for practitioner, and the right word for what he does. His work draws from the deep well of blackletter typography, gothic architecture, and the illegibility-as-intention aesthetic of wildstyle graffiti, but pushes all of it into spaces that feel closer to cathedral interiors than spray-painted walls.\n\nShane is a member of @calligraphymasters — an invitation-only collective of the world's most respected lettering artists and calligraphers. His practice operates under the name Mindful Release, a title that captures something true about how this kind of work functions. The obsessive repetition of letterforms, the meditative density of the compositions, the physical commitment of painting a room: this is work made through sustained attention, and it shows.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/shane-huss",
    studio: "Mindful Release",
    bookingInfo: "contact@mindfulrelease.com or DM via Instagram",
  },
  {
    name: "Lorenzo Gentil",
    slug: "lorenzo-gentil",
    portrait: "",
    specialty: "Realism & Dark Art",
    styles: ["Realism", "Dark Art"],
    instagram: "@lorenzogentil",
    bio: "Lorenzo Gentil is a tattoo artist known for bold realism and dark visual storytelling, bringing striking imagery to Sullen's Artist Series.",
    blogUrl: "https://www.sullenclothing.com/blogs/artists/lorenzo-gentil",
  },
];

/* ── Convert raw finder artists → DirectoryArtist ── */
function convertRawArtists(): DirectoryArtist[] {
  return RAW_FINDER_ARTISTS.map((raw) => {
    const loc = deriveLocation(raw.region, raw.bio);
    return {
      name: raw.name,
      slug: slugify(raw.name),
      portrait: shopifyImg(raw.photo.replace(/&width=\d+/, "&width=800")),
      specialty: raw.styles[0],
      styles: raw.styles,
      location: loc,
      region: raw.region,
      instagram: raw.handle,
      featured: raw.featured,
      bio: raw.bio,
      blogUrl: `https://www.sullenclothing.com/blogs/artists/${slugify(raw.name)}`,
      rating: raw.rating,
      pieces: raw.pieces,
    };
  });
}

/* ── Merge: curated first (they have richer data), then raw (deduplicated) ── */
function buildDirectory(): DirectoryArtist[] {
  const curatedSlugs = new Set(CURATED.map((a) => a.slug));
  const converted = convertRawArtists().filter((a) => !curatedSlugs.has(a.slug));
  const all = [...CURATED, ...converted];
  all.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return a.name.localeCompare(b.name);
  });
  return all;
}

export const directoryArtists: DirectoryArtist[] = buildDirectory();

/* ── Curated style filters (canonical names only) ── */
export const ALL_STYLES = [
  "Realism",
  "Black & Grey",
  "Color Realism",
  "Neo-Trad",
  "Traditional",
  "Illustrative",
  "Japanese",
  "Blackwork",
  "Chicano",
  "Lettering",
  "Fine Line",
] as const;

/** Map specialty strings → canonical filter style(s) so filtering works consistently */
export const SPECIALTY_TO_STYLES: Record<string, string[]> = {
  "Black & Grey Realism": ["Realism", "Black & Grey"],
  "Dark Realism": ["Realism", "Black & Grey"],
  "Neo-Traditional": ["Neo-Trad"],
  "Script & Lettering": ["Lettering"],
  "Gothic Lettering & Calligraphy": ["Lettering", "Blackwork"],
  "Illustrative Traditional": ["Illustrative", "Neo-Trad"],
  "Illustrative Blackwork": ["Illustrative", "Blackwork"],
  "Illustrative & Neo-Trad": ["Illustrative", "Neo-Trad"],
  "Dark Gothic & Medieval": ["Blackwork", "Illustrative"],
  "Traditional Samoan Tatau": ["Traditional"],
  "Color Realism": ["Color Realism", "Realism"],
  "Blackletter": ["Lettering"],
  "Calligraphy": ["Lettering"],
  "Graffiti": ["Lettering"],
};

export const REGION_GROUPS = [
  { label: "California", value: "California" },
  { label: "US — Other", value: "US - Other" },
  { label: "Europe", value: "Europe" },
  { label: "Australia", value: "Australia" },
  { label: "International", value: "International" },
] as const;

export function getDirectoryArtistBySlug(slug: string): DirectoryArtist | undefined {
  return directoryArtists.find((a) => a.slug === slug);
}

const ARTIST_NAME_ALIASES: Record<string, string> = {
  "lastly tatooer": "lasty tattooer",
  "lastly tattooer": "lasty tattooer",
};

function normalizeArtistName(value: string): string {
  const normalized = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return ARTIST_NAME_ALIASES[normalized] ?? normalized;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

export function getDirectoryArtistByName(name: string): DirectoryArtist | undefined {
  const target = normalizeArtistName(name);
  if (!target) return undefined;

  const exact = directoryArtists.find((a) => normalizeArtistName(a.name) === target);
  if (exact) return exact;

  const targetSlug = slugify(target);
  const bySlug = directoryArtists.find((a) => a.slug === targetSlug || slugify(a.name) === targetSlug);
  if (bySlug) return bySlug;

  const fuzzy = directoryArtists
    .map((artist) => ({
      artist,
      distance: levenshtein(normalizeArtistName(artist.name), target),
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  return fuzzy && fuzzy.distance <= 2 ? fuzzy.artist : undefined;
}
