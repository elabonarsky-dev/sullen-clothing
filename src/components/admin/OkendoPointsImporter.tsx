import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Download, X } from "lucide-react";

interface ParsedRecord {
  email: string;
  points: number;
  source?: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export function OkendoPointsImporter() {
  const [records, setRecords] = useState<ParsedRecord[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResult(null);
    setParseErrors([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      setParseErrors(["CSV must have a header row and at least one data row."]);
      return;
    }

    const header = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/^"(.*)"$/, "$1"));
    const emailIdx = header.findIndex((h) => h === "email" || h === "email_address" || h === "customer_email");
    const pointsIdx = header.findIndex((h) => h === "points" || h === "point_balance" || h === "balance" || h === "total_points");
    const sourceIdx = header.findIndex((h) => h === "source" || h === "origin");

    if (emailIdx === -1 || pointsIdx === -1) {
      setParseErrors([
        `Could not find required columns. Found: [${header.join(", ")}]`,
        'Expected columns: "email" (or "email_address", "customer_email") and "points" (or "point_balance", "balance", "total_points")',
      ]);
      return;
    }

    const parsed: ParsedRecord[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^"(.*)"$/, "$1"));
      const email = cols[emailIdx]?.trim();
      const pointsRaw = cols[pointsIdx]?.trim();
      const points = parseInt(pointsRaw, 10);

      if (!email || !email.includes("@")) {
        errors.push("Row " + (i + 1) + ': Invalid email "' + (email || "(empty)") + '"');
        continue;
      }
      if (isNaN(points) || points <= 0) {
        errors.push("Row " + (i + 1) + ': Invalid points "' + pointsRaw + '" for ' + email);
        continue;
      }

      parsed.push({
        email,
        points,
        source: sourceIdx !== -1 ? cols[sourceIdx] || "okendo" : "okendo",
      });
    }

    setRecords(parsed);
    setParseErrors(errors);
  };

  const handleImport = async () => {
    if (records.length === 0) return;

    setImporting(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        setImporting(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("import-okendo-points", {
        body: { records },
      });

      if (error) {
        toast.error("Import failed: " + error.message);
      } else {
        setResult(data as ImportResult);
        toast.success(`Imported ${(data as ImportResult).imported} point balances`);
      }
    } catch (err) {
      toast.error("Import request failed");
    } finally {
      setImporting(false);
    }
  };

  const handleClear = () => {
    setRecords([]);
    setParseErrors([]);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const downloadTemplate = () => {
    const csv = "email,points,source\ncustomer@example.com,250,okendo\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "okendo-points-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl uppercase tracking-wider text-foreground">
          Okendo Points Import
        </h2>
        <p className="text-sm text-muted-foreground font-body mt-1">
          Upload a CSV of customer emails and point balances to migrate historical Okendo loyalty data into Skull Points.
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <h3 className="font-display text-xs uppercase tracking-wider text-foreground">
          CSV Format
        </h3>
        <div className="text-xs text-muted-foreground font-body space-y-1">
          <p>Your CSV must include columns for <span className="text-foreground font-medium">email</span> and <span className="text-foreground font-medium">points</span>. An optional <span className="text-foreground font-medium">source</span> column can tag the origin.</p>
          <p>Duplicate imports are automatically prevented — if a user already has an Okendo import, they'll be skipped.</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-display uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download Template CSV
        </button>
      </div>

      {/* Upload area */}
      <div className="relative">
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
          <FileSpreadsheet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-display text-sm uppercase tracking-wider text-foreground">
            Drop CSV file here or click to browse
          </p>
          <p className="text-xs text-muted-foreground font-body mt-1">
            Accepts .csv files
          </p>
        </div>
      </div>

      {/* Parse errors */}
      {parseErrors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-2 text-destructive font-display text-xs uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            Parse Warnings ({parseErrors.length})
          </div>
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {parseErrors.map((err, i) => (
              <p key={i} className="text-xs text-destructive/80 font-body">{err}</p>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {records.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xs uppercase tracking-wider text-foreground">
              Ready to Import: {records.length} records
            </h3>
            <button onClick={handleClear} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-xs font-body">
                <thead className="sticky top-0 bg-secondary">
                  <tr>
                    <th className="text-left px-3 py-2 font-display uppercase tracking-wider text-muted-foreground">Email</th>
                    <th className="text-right px-3 py-2 font-display uppercase tracking-wider text-muted-foreground">Points</th>
                    <th className="text-left px-3 py-2 font-display uppercase tracking-wider text-muted-foreground">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {records.slice(0, 50).map((r, i) => (
                    <tr key={i} className="hover:bg-secondary/50">
                      <td className="px-3 py-2 text-foreground">{r.email}</td>
                      <td className="px-3 py-2 text-right text-foreground tabular-nums">{r.points.toLocaleString()}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {records.length > 50 && (
                <p className="text-center text-[11px] text-muted-foreground py-2 font-body">
                  …and {records.length - 50} more rows
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-display text-xs uppercase tracking-[0.15em] rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Import {records.length} Records
              </>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-primary font-display text-xs uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            Import Complete
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm font-body">
            <div className="bg-primary/10 rounded-md p-3 text-center">
              <p className="text-2xl font-display text-foreground">{result.imported}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Imported</p>
            </div>
            <div className="bg-secondary rounded-md p-3 text-center">
              <p className="text-2xl font-display text-foreground">{result.skipped}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Skipped</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-2 space-y-0.5">
              <p className="text-xs text-destructive font-display uppercase tracking-wider">Errors:</p>
              {result.errors.map((err, i) => (
                <p key={i} className="text-xs text-destructive/80 font-body">{err}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
