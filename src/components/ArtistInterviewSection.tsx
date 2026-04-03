import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, MessageCircle } from "lucide-react";
import type { InterviewQA } from "@/data/artists";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

interface ArtistInterviewSectionProps {
  artistName: string;
  interview: InterviewQA[];
}

export function ArtistInterviewSection({ artistName, interview }: ArtistInterviewSectionProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  // Detect if any QA has original (non-English) text
  const hasTranslation = interview.some(
    (qa) =>
      qa.original_question &&
      qa.original_answer &&
      qa.original_language &&
      qa.original_language.toLowerCase() !== "english"
  );

  const originalLanguage = hasTranslation
    ? interview.find((qa) => qa.original_language && qa.original_language.toLowerCase() !== "english")?.original_language
    : null;

  return (
    <section className="py-10 md:py-14">
      <div className="container max-w-2xl">
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 text-[10px] font-condensed font-semibold uppercase tracking-[0.4em] text-primary mb-2">
            <MessageCircle className="w-3.5 h-3.5" />
            Interview
          </span>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-5xl font-display font-bold uppercase tracking-tight text-foreground">
                In Their Words
              </h2>
              <p className="mt-2 text-sm font-body text-muted-foreground">
                A conversation with {artistName}
              </p>
            </div>
            {hasTranslation && (
              <Button
                variant={showOriginal ? "secondary" : "outline"}
                size="sm"
                className="gap-1.5 text-xs shrink-0"
                onClick={() => setShowOriginal(!showOriginal)}
              >
                <Globe className="w-3.5 h-3.5" />
                {showOriginal ? "English" : originalLanguage}
              </Button>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Accordion type="single" collapsible defaultValue="q-0" className="space-y-2">
            {interview.map((qa, index) => {
              const question = showOriginal && qa.original_question ? qa.original_question : qa.question;
              const answer = showOriginal && qa.original_answer ? qa.original_answer : qa.answer;

              return (
                <AccordionItem
                  key={index}
                  value={`q-${index}`}
                  className="border-b border-border last:border-0 px-0"
                >
                  <AccordionTrigger className="text-left font-body font-medium text-sm text-foreground hover:text-primary py-4 [&[data-state=open]]:text-primary transition-colors">
                    {question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm font-body leading-relaxed text-muted-foreground pb-5">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
