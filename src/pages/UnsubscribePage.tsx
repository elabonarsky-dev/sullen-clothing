import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "valid" | "already_unsubscribed" | "invalid" | "success" | "error";

export default function UnsubscribePage() {
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    // Validate token via GET
    const validate = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
        );
        const data = await res.json();
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already_unsubscribed");
        } else if (data.valid || res.ok) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (data?.success) {
        setStatus("success");
      } else if (data?.reason === "already_unsubscribed") {
        setStatus("already_unsubscribed");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
    setProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="font-display text-2xl uppercase tracking-wider text-foreground">
          Email Preferences
        </h1>

        {status === "loading" && (
          <p className="text-muted-foreground font-body">Verifying...</p>
        )}

        {status === "valid" && (
          <div className="space-y-4">
            <p className="text-muted-foreground font-body">
              Click below to unsubscribe from transactional emails.
            </p>
            <button
              onClick={handleUnsubscribe}
              disabled={processing}
              className="px-6 py-3 bg-primary text-primary-foreground font-display text-sm uppercase tracking-wider rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {processing ? "Processing..." : "Confirm Unsubscribe"}
            </button>
          </div>
        )}

        {status === "success" && (
          <p className="text-green-400 font-body">
            You have been successfully unsubscribed.
          </p>
        )}

        {status === "already_unsubscribed" && (
          <p className="text-muted-foreground font-body">
            You are already unsubscribed.
          </p>
        )}

        {status === "invalid" && (
          <p className="text-destructive font-body">
            Invalid or expired unsubscribe link.
          </p>
        )}

        {status === "error" && (
          <p className="text-destructive font-body">
            Something went wrong. Please try again later.
          </p>
        )}
      </div>
    </div>
  );
}
