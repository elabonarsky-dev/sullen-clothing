import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Skull, CheckCircle2, Loader2, ClipboardList, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SURVEY_POINTS = 75;

interface SurveyFollowUp {
  id: string;
  label: string;
  placeholder: string;
  showWhen: string[]; // show when answer is one of these values
}

interface SurveyQuestion {
  id: string;
  question: string;
  type: "single" | "multi" | "text";
  options?: string[];
  category: string;
  followUp?: SurveyFollowUp;
}

const QUESTIONS: SurveyQuestion[] = [
  {
    id: "shopping_frequency",
    question: "How often do you shop with us?",
    type: "single",
    options: ["First time", "A few times a year", "Monthly", "Weekly"],
    category: "shopping",
  },
  {
    id: "discovery",
    question: "How did you discover Sullen?",
    type: "single",
    options: ["Social media", "Friend / word of mouth", "Advertisement", "Google search", "Tattoo Artist", "Other"],
    category: "shopping",
  },
  {
    id: "shopping_for",
    question: "What do you shop for?",
    type: "single",
    options: ["Men's", "Women's", "Both"],
    category: "shopping",
  },
  {
    id: "product_interests",
    question: "What product types interest you most?",
    type: "multi",
    options: ["Graphic tees", "Hoodies & outerwear", "Headwear", "Accessories", "Artist collabs", "Limited drops", "Sales"],
    category: "style",
  },
  {
    id: "style_preference",
    question: "How would you describe your style?",
    type: "single",
    options: ["Streetwear", "Tattoo culture", "Casual / everyday", "Dark aesthetic", "Athletic / active", "Mix of everything"],
    category: "style",
  },
  {
    id: "fav_tee",
    question: "What's your fav tee?",
    type: "single",
    options: ["Standard", "Premium", "1-Ton"],
    category: "style",
  },
  {
    id: "pain_points",
    question: "What frustrates you most when shopping online?",
    type: "multi",
    options: ["Sizing inconsistency", "Slow shipping", "Limited size range", "Hard to find what I want", "Returns process", "Price vs quality", "Nothing — it's been great!"],
    category: "experience",
  },
  {
    id: "improvement",
    question: "What could we do better?",
    type: "text",
    category: "experience",
  },
  {
    id: "content_interest",
    question: "What content would you like to see more of?",
    type: "multi",
    options: ["Artist spotlights", "Behind the scenes", "Style guides", "New drop previews", "Tattoo culture stories", "Discount / sale alerts"],
    category: "engagement",
  },
  {
    id: "tattoo_styles",
    question: "What type of tattoos are you into?",
    type: "multi",
    options: ["Traditional / Old School", "Neo-traditional", "Japanese / Irezumi", "Realism / Portraits", "Black & Grey", "Chicano", "Tribal", "Lettering / Script", "Blackwork / Geometric", "New School", "Watercolor", "Not tattooed — just love the art"],
    category: "style",
  },
  {
    id: "early_designs",
    question: "Would you be interested in seeing designs early to help shape the future of Sullen and what we produce?",
    type: "single",
    options: ["Hell yeah, sign me up!", "Maybe — depends on the designs", "Nah, just surprise me"],
    category: "engagement",
  },
  {
    id: "influencer_interest",
    question: "Would you be interested in being an influencer for Sullen?",
    type: "single",
    options: ["Absolutely — let's do this!", "Maybe — tell me more", "Not my thing"],
    category: "engagement",
    followUp: {
      id: "social_handle",
      label: "Drop your Instagram or TikTok handle",
      placeholder: "@yourhandle",
      showWhen: ["Absolutely — let's do this!", "Maybe — tell me more"],
    },
  },
];

interface CustomerSurveyProps {
  userId: string;
}

export function CustomerSurvey({ userId }: CustomerSurveyProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);

  const { data: existingSurvey, isLoading } = useQuery({
    queryKey: ["customer-survey", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("customer_surveys" as any)
        .select("id, created_at")
        .eq("user_id", userId)
        .maybeSingle();
      return data;
    },
  });

  if (isLoading) return null;
  if (existingSurvey) {
    return (
      <div className="bg-card border border-border/20 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-display uppercase tracking-wider text-foreground">Survey Completed</p>
            <p className="text-[11px] font-body text-muted-foreground">
              Thanks for sharing! You earned <span className="text-primary font-semibold">{SURVEY_POINTS} Skull Points</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!showSurvey) {
    return (
      <div className="bg-card border border-primary/20 rounded-lg p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-display uppercase tracking-wider text-foreground">
              Tell Us About You
            </p>
            <p className="text-[11px] font-body text-muted-foreground">
              Complete a quick survey & earn <span className="text-primary font-semibold">{SURVEY_POINTS} Skull Points</span>
            </p>
          </div>
          <div className="flex items-center gap-1 text-primary">
            <Skull className="w-4 h-4" />
            <span className="text-sm font-display font-bold">+{SURVEY_POINTS}</span>
          </div>
        </div>
        <Button
          onClick={() => setShowSurvey(true)}
          className="w-full font-display text-xs uppercase tracking-wider"
          size="sm"
        >
          Start Survey
          <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    );
  }

  const currentQ = QUESTIONS[step];
  const totalSteps = QUESTIONS.length;
  const isLastStep = step === totalSteps - 1;
  const hasAnswer = currentQ.type === "text"
    ? typeof answers[currentQ.id] === "string" && (answers[currentQ.id] as string).trim().length > 0
    : answers[currentQ.id] !== undefined && (Array.isArray(answers[currentQ.id]) ? (answers[currentQ.id] as string[]).length > 0 : true);

  const handleSelect = (option: string) => {
    if (currentQ.type === "single") {
      setAnswers((prev) => ({ ...prev, [currentQ.id]: option }));
    } else if (currentQ.type === "multi") {
      const current = (answers[currentQ.id] as string[]) || [];
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      setAnswers((prev) => ({ ...prev, [currentQ.id]: updated }));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Save survey and award points atomically via server-side function
      const { error } = await supabase.rpc("submit_survey_with_points" as any, {
        p_user_id: userId,
        p_answers: answers,
        p_points: SURVEY_POINTS,
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["customer-survey"] });
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      toast.success(`You earned ${SURVEY_POINTS} Skull Points! 💀`);
    } catch (err: any) {
      console.error("Survey submission error:", err);
      if (err?.code === "23505") {
        toast.error("You've already completed this survey");
      } else {
        toast.error("Failed to submit survey. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card border border-primary/20 rounded-lg overflow-hidden">
      {/* Progress bar */}
      <div className="h-1 bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
            Question {step + 1} of {totalSteps}
          </p>
          <div className="flex items-center gap-1 text-primary">
            <Skull className="w-3.5 h-3.5" />
            <span className="text-xs font-display font-bold">+{SURVEY_POINTS}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm font-display uppercase tracking-wider text-foreground mb-4">
              {currentQ.question}
            </p>

            {currentQ.type === "text" ? (
              <textarea
                value={(answers[currentQ.id] as string) || ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))}
                placeholder="Share your thoughts..."
                className="w-full bg-secondary/50 border border-border/30 rounded-lg p-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                rows={3}
                maxLength={500}
              />
            ) : (
              <div className="grid gap-2">
                {currentQ.options?.map((option) => {
                  const isSelected = currentQ.type === "single"
                    ? answers[currentQ.id] === option
                    : ((answers[currentQ.id] as string[]) || []).includes(option);

                  return (
                    <button
                      key={option}
                      onClick={() => handleSelect(option)}
                      className={`text-left px-4 py-3 rounded-lg text-xs font-body transition-all border ${
                        isSelected
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "bg-secondary/30 border-border/20 text-foreground hover:bg-secondary/60"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.type === "multi" && (
              <p className="text-[10px] font-body text-muted-foreground/60 mt-2">
                Select all that apply
              </p>
            )}

            {currentQ.followUp && currentQ.followUp.showWhen.includes(answers[currentQ.id] as string) && (
              <div className="mt-3">
                <label className="text-[11px] font-display uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  {currentQ.followUp.label}
                </label>
                <input
                  type="text"
                  value={(answers[currentQ.followUp.id] as string) || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQ.followUp!.id]: e.target.value }))}
                  placeholder={currentQ.followUp.placeholder}
                  className="w-full bg-secondary/50 border border-border/30 rounded-lg px-3 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                  maxLength={100}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step > 0 ? setStep(step - 1) : setShowSurvey(false)}
            className="text-xs font-display uppercase tracking-wider"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>

          {isLastStep ? (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || !hasAnswer}
              className="font-display text-xs uppercase tracking-wider"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : (
                <Skull className="w-3.5 h-3.5 mr-1" />
              )}
              Submit & Earn {SURVEY_POINTS} pts
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setStep(step + 1)}
              disabled={!hasAnswer}
              className="font-display text-xs uppercase tracking-wider"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
