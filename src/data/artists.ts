import lastlyPortrait from "@/assets/lastly-tattooer-portrait.jpg";

export interface InterviewQA {
  question: string;
  answer: string;
  original_question?: string;
  original_answer?: string;
  original_language?: string;
}

export interface ArtistProduct {
  slug: string;
  artistName: string;
  productName: string;
  tagline: string;
  price: number;
  description: string;
  artistBio: string;
  artistLocation: string;
  artistSpecialty: string;
  artistInstagram?: string;
  sizes: string[];
  features: string[];
  heroImage: string;
  productImages: string[];
  artistPortrait: string;
  artistQuote: string;
  interview?: InterviewQA[];
  shopifyHandle: string;
}

const premiumFeatures = [
  "Premium Fit",
  "Short sleeves",
  "Tagless for comfort",
  "Woven Sullen Badge label on left sleeve",
  "100% soft cotton jersey",
  "Custom Dye Tee",
  "Set-in rib collar with shoulder-to-shoulder taping",
  "Double-needle sleeve and bottom hem",
  "Preshrunk to minimize shrinkage",
  "Machine washable",
  "Weight: 185g/m2",
];

const standardFeatures = [
  "Standard Fit",
  "Short sleeves",
  "Tagless for comfort",
  "Woven Sullen Badge label on left sleeve",
  "100% Cotton Body",
  "Machine washable",
];

const defaultSizes = ["S", "M", "L", "XL", "2X", "3X", "4X", "5X"];

export const artistProducts: ArtistProduct[] = [
  {
    slug: "lastly-tattooer",
    shopifyHandle: "lastly-tatooer",
    artistName: "Lasty Tattooer",
    productName: "Lasty Tattooer Standard",
    tagline: "When the last light fades, the true warriors remain.",
    price: 27.95,
    description:
      "When the last light fades and the ink runs deep, only the true warriors remain—this is where art meets armor in the LASTY TATTOOER tee. A gothic knight stands sentinel in flickering lantern light, sword drawn against the darkness while flames dance around her armored silhouette beneath a canvas of stars.",
    artistBio:
      "Lasty Tattooer is a dark arts specialist whose work fuses medieval gothic imagery with modern tattoo technique. Known for intricate armor, weaponry, and warrior motifs, Lasty brings a cinematic depth to every piece—turning skin into stained glass windows of a forgotten cathedral.",
    artistLocation: "Los Angeles, CA",
    artistSpecialty: "Dark Gothic & Medieval",
    artistInstagram: "@lastytattooer",
    sizes: defaultSizes,
    features: standardFeatures,
    heroImage:
      "https://cdn.shopify.com/s/files/1/1096/0120/files/lastly-tattooer-up-close-life.jpg?v=1773688404",
    productImages: [
      "https://cdn.shopify.com/s/files/1/1096/0120/files/lastly-tattooer-up-close-life.jpg?v=1773688404",
      "https://cdn.shopify.com/s/files/1/1096/0120/files/lastly-tattooer-far-life.jpg?v=1773688404",
      "https://cdn.shopify.com/s/files/1/1096/0120/files/lastly-tattooer.jpg?v=1773688404",
      "https://cdn.shopify.com/s/files/1/1096/0120/files/lastly-tattooer-front-life.jpg?v=1773688404",
      "https://cdn.shopify.com/s/files/1/1096/0120/files/lastly_tattooer_studio.jpg?v=1773688404",
      "https://cdn.shopify.com/s/files/1/1096/0120/files/lastly_tattooer_studio_front.jpg?v=1773688404",
    ],
    artistPortrait: lastlyPortrait,
    artistQuote:
      "Every line I draw carries the weight of a thousand years of warrior tradition. The needle is my sword.",
    interview: [
      {
        question: "What inspired you about art and being a tattoo artist?",
        answer: "For as long as I can remember, I have always liked to draw and create things. I like that art is a true time marker, and I like that something immaterial like a thought or an idea can become physical like a painting. What I like the most about tattooing is the timelessness. I love what the tattoo allows us to do—create a design that follows the lines of the body and make it dynamic with the skin as support, achieving a real harmonious movement. And of course, I like to exchange with people, transform the ideas they transmit to me into something concrete and make them spend a unique moment that they will remember all their lives.",
      },
      {
        question: "What themes or concepts often show up in your work?",
        answer: "The themes that often come up are female figures transformed into goddesses, witches, magicians, knights. And we also find animals, vegetations, flowers. Generally, with the neo-traditional style, we can achieve almost everything, and that's what I like the most about this style.",
      },
      {
        question: "How do you approach finding inspiration for your designs?",
        answer: "In many things, to tell the truth. Nature at first—it's very rich in sources of inspiration. In Art Nouveau, Art Deco, for example, and more recently in comic books, video games, and dark fantasy.",
      },
      {
        question: "Are there any designs or tattoos you're particularly proud of?",
        answer: "I don't know if I can choose some, but recently people are starting to entrust me with big projects like back pieces, full arm sleeves or legs, and I think that's what touches me the most.",
      },
      {
        question: "How did you first become involved with Sullen?",
        answer: "It's super simple. I obviously knew Sullen and I like what they do, and one day someone from the team contacted me and offered me to collaborate with them.",
      },
      {
        question: "Can you describe your design process for the Sullen artist series?",
        answer: "My process is quite simple. I start to sketch several ideas until one of them stands out, and I push in this direction until I get what I want. The idea here was to have something quite melancholic with this knight lady who has a peaceful face despite the sword in her chest, as if she had accepted her fate.",
      },
      {
        question: "What aspects of Sullen's brand resonated with you and your art?",
        answer: "Maybe because it's not the first time Sullen collaborates with an artist who does neo-traditional, and the themes we see at Sullen are quite diverse, so I think it can affect people from the brand's audience. And I mean, who doesn't like knights?",
      },
      {
        question: "What message do you hope to convey through your work?",
        answer: "I don't know if it's really a message to get across, but I hope people can escape like me through this medium that is tattooing or art or crafts, whatever it is. And I would love that people do not forget this wonderful and complete style that is the neo-traditional.",
      },
    ],
  },
  {
    slug: "zach-goldin",
    shopifyHandle: "zach-goldin",
    artistName: "Zach Goldin",
    productName: "Zach Goldin Premium",
    tagline: "A grim vision of faith and fate, crowned in thorns.",
    price: 32.50,
    description:
      "Artist @goldin.misfits delivers a grim vision of faith and fate, crowned in thorns with a vertebrae infested backdrop. Printed in black-and-grey on our jet black premium tee, for a tailored fit and soft-hand feel.",
    artistBio:
      "Zach Goldin is a tattoo artist whose dark, illustrative work explores themes of mortality, faith, and the macabre. His detailed black-and-grey style draws from religious iconography and anatomical studies, creating pieces that feel both haunting and reverent.",
    artistLocation: "Los Angeles, CA",
    artistSpecialty: "Black & Grey Illustrative",
    artistInstagram: "@goldin.misfits",
    sizes: defaultSizes,
    features: premiumFeatures,
    heroImage:
      "https://cdn.shopify.com/s/files/1/1096/0120/files/zach-goldin-lifestyle.jpg?v=1773106980",
    productImages: [
      "https://cdn.shopify.com/s/files/1/1096/0120/files/zach-goldin-lifestyle.jpg?v=1773106980",
      "https://cdn.shopify.com/s/files/1/1096/0120/files/web-BANNER-ZACH-GOLDIN.jpg?v=1773091548",
    ],
    artistPortrait:
      "https://cdn.shopify.com/s/files/1/1096/0120/files/zach-goldin-lifestyle.jpg?v=1773106980",
    artistQuote:
      "I draw what keeps me up at night. Thorns, bones, and the weight of belief.",
  },
  {
    slug: "el-stitch",
    shopifyHandle: "el-stitch",
    artistName: "El Stitch",
    productName: "El Stitch Premium",
    tagline: "The classic badge, glitched and reborn.",
    price: 32.50,
    description:
      "El Stitch takes our classic Sullen Badge and runs it through the grinder, breaking it into pixel blocks and color shifts that feel straight out of an old-school screen crash. Printed on our jet black premium tee for a soft feel and tailored fit.",
    artistBio:
      "El Stitch is a digital-meets-analog artist who deconstructs familiar imagery into fragmented, glitch-inspired compositions. His work bridges the gap between street art and pixel art, giving everything a raw, distorted energy.",
    artistLocation: "Los Angeles, CA",
    artistSpecialty: "Glitch Art & Digital",
    artistInstagram: "@el_stitch",
    sizes: defaultSizes,
    features: premiumFeatures,
    heroImage:
      "https://cdn.shopify.com/s/files/1/1096/0120/files/EL-STICH-LIFESTYLE_d1f29c14-8d75-4a4c-aea5-6e320430bf1d.jpg?v=1772763149",
    productImages: [
      "https://cdn.shopify.com/s/files/1/1096/0120/files/EL-STICH-LIFESTYLE_d1f29c14-8d75-4a4c-aea5-6e320430bf1d.jpg?v=1772763149",
    ],
    artistPortrait:
      "https://cdn.shopify.com/s/files/1/1096/0120/files/EL-STICH-LIFESTYLE_d1f29c14-8d75-4a4c-aea5-6e320430bf1d.jpg?v=1772763149",
    artistQuote:
      "I break things down to build something new. Every pixel has a purpose.",
  },
  {
    slug: "shelter",
    shopifyHandle: "shelter",
    artistName: "Geoffery Shelter",
    productName: "Shelter Premium",
    tagline: "The badge, refined with darker intent.",
    price: 32.50,
    description:
      "Geoffery Shelter puts his own touch on the classic Sullen Badge with this sharp rework, surrounded by flowing, ornamental linework that gives the whole piece a darker, refined feel. Printed on our grey premium tee for a soft feel and tailored fit.",
    artistBio:
      "Geoffery Shelter is a tattoo artist known for ornamental and neo-traditional linework. His refined approach to the Sullen Badge brings flowing, dark elegance to a familiar icon—proving that even classics can evolve.",
    artistLocation: "Los Angeles, CA",
    artistSpecialty: "Ornamental & Neo-Traditional",
    artistInstagram: "@tattoogeof",
    sizes: defaultSizes,
    features: premiumFeatures,
    heroImage:
      "https://cdn.shopify.com/s/files/1/1096/0120/files/shelter-lifestyle-back.jpg?v=1772763626",
    productImages: [
      "https://cdn.shopify.com/s/files/1/1096/0120/files/shelter-lifestyle-back.jpg?v=1772763626",
    ],
    artistPortrait:
      "https://cdn.shopify.com/s/files/1/1096/0120/files/shelter-lifestyle-back.jpg?v=1772763626",
    artistQuote:
      "Ornamentation is just darkness wearing its best suit.",
  },
  {
    slug: "red-reaper",
    shopifyHandle: "red-reaper",
    artistName: "Lorenzo Gentil",
    productName: "Red Reaper",
    tagline: "Dark realism meets bold design.",
    price: 32.50,
    description:
      "Lorenzo Gentil brings his signature realism and dark art style to the Red Reaper tee, combining striking imagery with Sullen's Artist Series quality.",
    artistBio:
      "Lorenzo Gentil is a tattoo artist known for bold realism and dark visual storytelling, bringing striking imagery to Sullen's Artist Series.",
    artistLocation: "",
    artistSpecialty: "Realism & Dark Art",
    artistInstagram: "@lorenzogentil",
    sizes: defaultSizes,
    features: premiumFeatures,
    heroImage: "",
    productImages: [],
    artistPortrait: "",
    artistQuote: "Every piece tells a story written in shadow and ink.",
  },
];

export function getArtistBySlug(slug: string): ArtistProduct | undefined {
  return artistProducts.find((a) => a.slug === slug);
}

export function getArtistByShopifyHandle(handle: string): ArtistProduct | undefined {
  return artistProducts.find((a) => a.shopifyHandle === handle);
}
