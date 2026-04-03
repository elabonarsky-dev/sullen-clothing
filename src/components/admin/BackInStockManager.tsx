import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Mail, Check, Loader2, Search, Package, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface BackInStockRequest {
  id: string;
  email: string;
  product_handle: string;
  product_title: string;
  variant_id: string;
  variant_title: string | null;
  notified: boolean;
  created_at: string;
}

type FilterStatus = "all" | "pending" | "notified";

export function BackInStockManager() {
  const [requests, setRequests] = useState<BackInStockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [notifying, setNotifying] = useState<Set<string>>(new Set());
  const [bulkNotifying, setBulkNotifying] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("back_in_stock_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch requests:", error);
      toast.error("Failed to load requests");
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const markAsNotified = async (ids: string[]) => {
    const { error } = await supabase
      .from("back_in_stock_requests")
      .update({ notified: true })
      .in("id", ids);

    if (error) {
      console.error("Failed to update:", error);
      toast.error("Failed to mark as notified");
      return false;
    }

    setRequests((prev) =>
      prev.map((r) => (ids.includes(r.id) ? { ...r, notified: true } : r))
    );
    return true;
  };

  const handleNotifySingle = async (id: string) => {
    setNotifying((prev) => new Set(prev).add(id));
    const req = requests.find((r) => r.id === id);
    if (req) {
      try {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "back-in-stock-notification",
            recipientEmail: req.email,
            idempotencyKey: `bis-notify-${req.id}`,
            templateData: {
              productTitle: req.product_title,
              variantTitle: req.variant_title,
              productHandle: req.product_handle,
            },
          },
        });
      } catch (emailErr) {
        console.error("Failed to send notification email:", emailErr);
      }
    }
    const ok = await markAsNotified([id]);
    if (ok) toast.success("Notification sent");
    setNotifying((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleBulkNotify = async (productHandle: string) => {
    setBulkNotifying(true);
    const pending = requests.filter((r) => r.product_handle === productHandle && !r.notified);
    const ids = pending.map((r) => r.id);

    if (ids.length === 0) {
      toast.info("No pending requests for this product");
      setBulkNotifying(false);
      return;
    }

    // Send notification email to each subscriber
    for (const req of pending) {
      try {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "back-in-stock-notification",
            recipientEmail: req.email,
            idempotencyKey: `bis-notify-${req.id}`,
            templateData: {
              productTitle: req.product_title,
              variantTitle: req.variant_title,
              productHandle: req.product_handle,
            },
          },
        });
      } catch (emailErr) {
        console.error("Failed to send notification to", req.email, emailErr);
      }
    }

    const ok = await markAsNotified(ids);
    if (ok) toast.success(`Sent ${ids.length} notification(s)`);
    setBulkNotifying(false);
  };

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (filter === "pending" && r.notified) return false;
      if (filter === "notified" && !r.notified) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.email.toLowerCase().includes(q) ||
          r.product_title.toLowerCase().includes(q) ||
          r.product_handle.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requests, filter, search]);

  // Group by product for summary cards
  const productGroups = useMemo(() => {
    const map = new Map<string, { title: string; handle: string; total: number; pending: number }>();
    for (const r of requests) {
      const existing = map.get(r.product_handle);
      if (existing) {
        existing.total++;
        if (!r.notified) existing.pending++;
      } else {
        map.set(r.product_handle, {
          title: r.product_title,
          handle: r.product_handle,
          total: 1,
          pending: r.notified ? 0 : 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.pending - a.pending);
  }, [requests]);

  const totalPending = requests.filter((r) => !r.notified).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl uppercase tracking-wider text-foreground">
          Back in Stock Requests
        </h2>
        <p className="text-sm text-muted-foreground font-body mt-1">
          Manage customer notifications for sold-out products.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs font-display uppercase tracking-wider">Total Requests</span>
          </div>
          <p className="text-2xl font-display text-foreground">{requests.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Bell className="w-4 h-4" />
            <span className="text-xs font-display uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-2xl font-display text-primary">{totalPending}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Package className="w-4 h-4" />
            <span className="text-xs font-display uppercase tracking-wider">Products</span>
          </div>
          <p className="text-2xl font-display text-foreground">{productGroups.length}</p>
        </div>
      </div>

      {/* Product Groups with Bulk Notify */}
      {productGroups.filter((g) => g.pending > 0).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-display uppercase tracking-wider text-muted-foreground">
            Products with pending requests
          </h3>
          <div className="flex flex-wrap gap-2">
            {productGroups
              .filter((g) => g.pending > 0)
              .map((g) => (
                <div
                  key={g.handle}
                  className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-body text-foreground truncate max-w-[200px]">
                      {g.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {g.pending} pending of {g.total}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] font-display uppercase tracking-wider border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleBulkNotify(g.handle)}
                    disabled={bulkNotifying}
                  >
                    <Mail className="w-3 h-3 mr-1" />
                    Notify All
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}


      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm font-body bg-secondary/50 border-border/30"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as FilterStatus)}>
          <SelectTrigger className="w-[150px] h-9 text-xs font-display uppercase tracking-wider bg-secondary/50 border-border/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="notified">Notified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-body">No requests found</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-card/50">
                <TableHead className="text-[10px] font-display uppercase tracking-wider">Email</TableHead>
                <TableHead className="text-[10px] font-display uppercase tracking-wider">Product</TableHead>
                <TableHead className="text-[10px] font-display uppercase tracking-wider">Variant</TableHead>
                <TableHead className="text-[10px] font-display uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-[10px] font-display uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-[10px] font-display uppercase tracking-wider text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="border-border/30">
                  <TableCell className="text-xs font-body text-foreground">{r.email}</TableCell>
                  <TableCell className="text-xs font-body text-foreground max-w-[200px] truncate">
                    {r.product_title}
                  </TableCell>
                  <TableCell className="text-xs font-body text-muted-foreground">
                    {r.variant_title || "—"}
                  </TableCell>
                  <TableCell className="text-xs font-body text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {r.notified ? (
                      <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400 bg-green-500/10">
                        <Check className="w-3 h-3 mr-1" />
                        Notified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10">
                        <Bell className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!r.notified && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[10px] font-display uppercase tracking-wider text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => handleNotifySingle(r.id)}
                        disabled={notifying.has(r.id)}
                      >
                        {notifying.has(r.id) ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Mail className="w-3 h-3 mr-1" />
                            Notify
                          </>
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
