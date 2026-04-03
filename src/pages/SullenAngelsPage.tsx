import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Instagram } from "lucide-react";

interface Angel {
  name: string;
  photo: string;
  instagram?: string;
}

const angels: Angel[] = [
  { name: "Amanda", photo: "https://ucarecdn.com/f7fbc9ce-6b42-435e-a2a5-1759247df3ed/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/xoamanda_jadexo/" },
  { name: "Bernadette", photo: "https://ucarecdn.com/3571245e-0f21-4269-8516-34f7e51bf571/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/itsmsbernadette/" },
  { name: "CervEna", photo: "https://ucarecdn.com/a1fcd2ef-be9a-4663-be4d-170bb7748227/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/cervenafox/" },
  { name: "Erika", photo: "https://ucarecdn.com/1d852eaa-7d43-476f-86c7-c4f03f784120/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/e_young_13/" },
  { name: "Gypsy Rose", photo: "https://ucarecdn.com/ef9043a4-621b-4d29-b698-fe790525447f/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/gypsyroseink/" },
  { name: "Heather M.", photo: "https://ucarecdn.com/f456b5d1-bd0a-49c2-8c85-bcd00af23bc1/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/heathermoss313/" },
  { name: "Sarah J.", photo: "https://ucarecdn.com/25b51325-8278-4242-8254-ca491fe221d2/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/hellosarahjensen/" },
  { name: "Shawna", photo: "https://ucarecdn.com/18fefe5d-3059-4350-8da5-ee9dd0579c14/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/shawna.naysia/" },
  { name: "Raquel", photo: "https://ucarecdn.com/a8f68c72-f048-4b08-b02c-6960eace5ff9/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/msgemsherself/" },
  { name: "Harmony", photo: "https://ucarecdn.com/e1cda5a8-27ae-4f77-965f-fe6b8b8e66e5/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/harmonynigh/" },
  { name: "Stevie", photo: "https://ucarecdn.com/a9ee0134-2d22-4cc4-931f-bd434e08fe05/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/misssteviefit/" },
  { name: "Jaylynn", photo: "https://ucarecdn.com/e57b3034-4505-4e14-b18a-256e3a851b21/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/jaylynn451/" },
  { name: "Max", photo: "https://ucarecdn.com/555b6775-8fe2-4d4b-9e56-370300ab7d5a/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/max818/" },
  { name: "Rosie", photo: "https://ucarecdn.com/184f79a9-2136-417a-be07-4d8fdc31eb9f/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/xladymisfitx/" },
  { name: "Eliza", photo: "https://ucarecdn.com/969c21ae-d01c-408f-aa74-da507b87294e/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/elizawinn/" },
  { name: "Raquel R.", photo: "https://ucarecdn.com/4d8f060b-ea21-4a2a-ba44-c788cedbe3f8/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/_raquelreynolds_/" },
  { name: "Cat", photo: "https://ucarecdn.com/7809dfcb-da2a-40d6-9f43-162abed26049/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/catmarini/" },
  { name: "Leigha", photo: "https://ucarecdn.com/d0b3ddbb-dcc1-499a-a99a-4e2968d6560e/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/leighahagan/" },
  { name: "Jessica S.", photo: "https://ucarecdn.com/3cb4ea55-9363-49ce-8fb1-2cc128f66b58/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/babyberzerker/" },
  { name: "Pony", photo: "https://ucarecdn.com/4e9e5810-d513-40cd-9f53-e537f6da1bfe/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/ponywave/" },
  { name: "Bre", photo: "https://ucarecdn.com/542b44c6-e524-444d-b05a-ecb9de11c05e/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/bree_bre_/" },
  { name: "Chelsea", photo: "https://ucarecdn.com/9c06ac70-256f-4308-874e-0aa8f9062997/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/thechelsearae/" },
  { name: "Gwen", photo: "https://ucarecdn.com/64df11cc-7110-4697-99db-edc5af5d65f7/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/gwen.sophie.x/" },
  { name: "Macey", photo: "https://ucarecdn.com/f44806b0-1517-4f9a-a6c0-506e7c176e95/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/misslacedupmae/" },
  { name: "Makani", photo: "https://ucarecdn.com/b9951298-f1f8-4769-ad59-1ea6bee913cf/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/makaniterror/" },
  { name: "Esther", photo: "https://ucarecdn.com/5560a50c-4f2b-4474-bdac-391efbe2534e/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/estherhanuka/" },
  { name: "Sara", photo: "https://ucarecdn.com/59f8d7fc-60ac-4abd-a0ba-b7dadb6bd525/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/dankdoll/" },
  { name: "Katia", photo: "https://ucarecdn.com/00c88eea-e59f-446f-b2a6-f8e1503a3851/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/tattooedkatia/" },
  { name: "Tysha", photo: "https://ucarecdn.com/d8d32455-7f09-4e2c-bb6b-32cae912fb6f/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/mamma_ty/" },
  { name: "Kristin", photo: "https://ucarecdn.com/d9dfadaa-2558-4519-b7a3-bb7fc0dad21e/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/kristin_dibiase/" },
  { name: "Taylor", photo: "https://ucarecdn.com/a775befd-e0a2-4eb8-ab40-d0f87b2d686e/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/the_taylormay/" },
  { name: "Val", photo: "https://ucarecdn.com/28deff38-45e9-4859-b058-aacf6e78bd32/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/valeriecake_/" },
  { name: "Jessica H.", photo: "https://ucarecdn.com/5f7edbcd-8045-41c0-a8db-3a0f6286acd2/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/jessharbour/" },
  { name: "Lauren", photo: "https://ucarecdn.com/92aee3a4-6189-4dae-9a78-7ed637b4972e/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/laurenhashianofficial/" },
  { name: "Tiffani", photo: "https://ucarecdn.com/a5229078-864f-4908-9126-5354d485b72e/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/tiffani.rey_/" },
  { name: "Sam", photo: "https://ucarecdn.com/22a33f57-1165-48b5-9476-8b9519dd06f1/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/samhowlett/" },
  { name: "Cleo", photo: "https://ucarecdn.com/bdd6f289-6988-4d67-964f-cd09f97c9c4d/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/cleokinnaman/" },
  { name: "Brooklyn", photo: "https://ucarecdn.com/4416e1be-b233-448a-abf8-a02af5893f9b/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/missesbrooklynn/" },
  { name: "Megan", photo: "https://ucarecdn.com/15a04e54-5085-4968-873b-e1bf25ddd21b/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/dj_megan_daniels/" },
  { name: "Brittny", photo: "https://ucarecdn.com/6e851106-832c-42e1-8401-d6be7ad39deb/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/britbaylis/" },
  { name: "Heather G.", photo: "https://ucarecdn.com/b35b971e-b08c-4df5-8955-8433d63439e9/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/" },
  { name: "Teya", photo: "https://ucarecdn.com/ae3a6491-5dd8-4abb-a933-36738df9dc38/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/teya_salat/" },
  { name: "Cherry Dollface", photo: "https://ucarecdn.com/9ba3ccf5-8acc-4a8f-ad96-e819ebbef0d0/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/thecherrydollface/" },
  { name: "Elle", photo: "https://ucarecdn.com/6ccddd27-e859-4665-b821-136a58c6f9ac/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/elleaudra/" },
  { name: "Mary Leigh", photo: "https://ucarecdn.com/cef83a0d-272b-46af-9ba6-7a741d0dab7e/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/missmaryleigh/" },
  { name: "Stefani", photo: "https://ucarecdn.com/300e5266-e173-46cd-b1fb-97f8c3228941/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/steflovaworld/" },
  { name: "Sini", photo: "https://ucarecdn.com/5fd817fb-758d-423f-9b55-c8755da49710/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/siniariell/" },
  { name: "Hannah", photo: "https://ucarecdn.com/28deff38-45e9-4859-b058-aacf6e78bd32/-/format/auto/-/stretch/off/-/resize/800x/-/quality/lighter/", instagram: "https://www.instagram.com/the.hannahjensen/" },
];

function AngelCard({ angel, index }: { angel: Angel; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: (index % 4) * 0.08 }}
      className="group relative overflow-hidden rounded-sm"
    >
      <div className="aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={angel.photo}
          alt={`Sullen Angel ${angel.name}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="font-display text-sm uppercase tracking-[0.15em] text-white mb-2">
          {angel.name}
        </h3>
        {angel.instagram && (
          <a
            href={angel.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>Instagram</span>
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default function SullenAngelsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Sullen Angels | Sullen Clothing"
        description="Meet the Sullen Angels — our crew of tattoo-loving, ink-inspired women who embody the Sullen lifestyle."
        path="/pages/sullen-angels"
      />
      <SiteHeader />

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-black">
        <div className="max-w-4xl mx-auto py-12 sm:py-20 px-4 text-center">
          <img
            src="https://ucarecdn.com/5e4227ec-8682-4d5c-88e4-1a90d7ab6919/-/format/auto/-/stretch/off/-/resize/1200x/-/quality/lighter/"
            alt="Sullen Angels"
            className="w-full max-w-2xl mx-auto"
          />
        </div>
      </section>

      {/* Angels Grid */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container max-w-7xl px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {angels.map((angel, i) => (
              <AngelCard key={`${angel.name}-${i}`} angel={angel} index={i} />
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
