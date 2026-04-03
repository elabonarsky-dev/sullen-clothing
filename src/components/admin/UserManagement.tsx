import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Loader2, KeyRound, UserPlus, Shield, Clock, Check, Trash2, UserCheck, Users, XCircle, History } from "lucide-react";

type StaffRole = "admin" | "artist_manager" | "customer_service";

interface PendingInvite {
  id: string;
  email: string;
  role: StaffRole;
  claimed_at: string | null;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: StaffRole;
  email: string | null;
}

interface AuditEntry {
  id: string;
  action: string;
  target_email: string | null;
  target_user_id: string | null;
  role: string;
  performed_by: string;
  created_at: string;
  performer_email?: string | null;
}

export function UserManagement() {
  const [resetEmail, setResetEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<StaffRole>("artist_manager");
  const [assigning, setAssigning] = useState(false);

  // Pre-invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffRole>("customer_service");
  const [inviting, setInviting] = useState(false);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);

  // Team members state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Audit log state
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(true);

  const logAudit = async (action: string, role: string, targetEmail?: string, targetUserId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("role_audit_log").insert({
      action,
      role,
      target_email: targetEmail || null,
      target_user_id: targetUserId || null,
      performed_by: user.id,
    } as any);
    fetchAuditLog();
  };

  const fetchAuditLog = async () => {
    const { data } = await supabase
      .from("role_audit_log" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!data || (data as any[]).length === 0) {
      setAuditLog([]);
      setLoadingAudit(false);
      return;
    }

    const entries = data as any as AuditEntry[];
    const performerIds = [...new Set(entries.map(e => e.performed_by))];
    const { data: performers } = await supabase
      .from("vault_members")
      .select("user_id, email")
      .in("user_id", performerIds);

    const emailMap = new Map((performers || []).map(p => [p.user_id, p.email]));
    setAuditLog(entries.map(e => ({ ...e, performer_email: emailMap.get(e.performed_by) || null })));
    setLoadingAudit(false);
  };

  const fetchInvites = async () => {
    const { data } = await supabase
      .from("pending_invites")
      .select("*")
      .order("created_at", { ascending: false });
    setInvites((data as PendingInvite[]) || []);
    setLoadingInvites(false);
  };

  const fetchTeamMembers = async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("id, user_id, role");

    if (!roles || roles.length === 0) {
      setTeamMembers([]);
      setLoadingTeam(false);
      return;
    }

    const userIds = [...new Set(roles.map(r => r.user_id))];
    const { data: members } = await supabase
      .from("vault_members")
      .select("user_id, email")
      .in("user_id", userIds);

    const emailMap = new Map((members || []).map(m => [m.user_id, m.email]));

    setTeamMembers(
      roles.map(r => ({
        id: r.id,
        user_id: r.user_id,
        role: r.role as StaffRole,
        email: emailMap.get(r.user_id) || null,
      }))
    );
    setLoadingTeam(false);
  };

  useEffect(() => {
    fetchInvites();
    fetchTeamMembers();
    fetchAuditLog();
  }, []);

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-reset-password", {
        body: {
          email: resetEmail.trim(),
          redirect_to: `${window.location.origin}/reset-password`,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Password reset email sent to ${resetEmail}`);
      setResetEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setSending(false);
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setAssigning(true);
    try {
      const { data: members } = await supabase
        .from("vault_members")
        .select("user_id")
        .eq("email", newEmail.trim().toLowerCase())
        .not("user_id", "is", null)
        .limit(1);

      let userId: string | null = members?.[0]?.user_id ?? null;

      if (!userId) {
        toast.error("User not found. They need to create an account first, or use Pre-Invite below.");
        setAssigning(false);
        return;
      }

      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: newRole }, { onConflict: "user_id,role" });

      if (error) throw error;
      toast.success(`Assigned ${newRole} role to ${newEmail}`);
      await logAudit("assigned", newRole, newEmail.trim().toLowerCase(), userId);
      setNewEmail("");
      fetchTeamMembers();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign role");
    } finally {
      setAssigning(false);
    }
  };

  const handlePreInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("pending_invites")
        .insert({
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          invited_by: user.id,
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("This email already has a pending invite for that role.");
        } else {
          throw error;
        }
      } else {
        toast.success(`Pre-invite created! ${inviteEmail} will get the ${inviteRole} role when they sign up.`);
        await logAudit("pre_invited", inviteRole, inviteEmail.trim().toLowerCase());
        setInviteEmail("");
        fetchInvites();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create invite");
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteInvite = async (id: string) => {
    const invite = invites.find(i => i.id === id);
    const { error } = await supabase.from("pending_invites").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove invite");
    } else {
      toast.success("Invite removed");
      if (invite) await logAudit("invite_deleted", invite.role, invite.email);
      setInvites(invites.filter(i => i.id !== id));
    }
  };

  const handleRevokeRole = async (member: TeamMember) => {
    const confirmMsg = `Revoke ${roleLabel(member.role)} from ${member.email || member.user_id}?`;
    if (!window.confirm(confirmMsg)) return;

    setRevokingId(member.id);
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", member.id);

      if (error) throw error;
      toast.success(`Revoked ${roleLabel(member.role)} from ${member.email || "user"}`);
      await logAudit("revoked", member.role, member.email || undefined, member.user_id);
      setTeamMembers(prev => prev.filter(m => m.id !== member.id));
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke role");
    } finally {
      setRevokingId(null);
    }
  };

  const roleLabel = (r: string) =>
    r === "admin" ? "Admin" : r === "artist_manager" ? "Artist Manager" : "Customer Service";

  const actionLabel = (a: string) => {
    switch (a) {
      case "assigned": return "Assigned";
      case "revoked": return "Revoked";
      case "pre_invited": return "Pre-Invited";
      case "invite_deleted": return "Invite Deleted";
      default: return a;
    }
  };

  const actionColor = (a: string) => {
    switch (a) {
      case "assigned": return "text-green-500";
      case "revoked": return "text-red-400";
      case "pre_invited": return "text-blue-400";
      case "invite_deleted": return "text-amber-400";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl uppercase tracking-wider text-foreground mb-1">User Management</h2>
        <p className="text-sm text-muted-foreground font-body">Manage team access, pre-invite members, and send password resets.</p>
      </div>

      {/* Pre-Invite Team Members */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="w-5 h-5 text-primary" />
          <h3 className="font-display text-sm uppercase tracking-wider text-foreground">Pre-Invite Team Member</h3>
        </div>
        <p className="text-xs text-muted-foreground font-body mb-4">
          Add an email and role — when this person signs up, their role is automatically assigned. No manual follow-up needed.
        </p>
        <form onSubmit={handlePreInvite} className="flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="newteam@sullenclothing.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            className="flex-1 bg-secondary border-border"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as StaffRole)}
            className="h-10 rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
          >
            <option value="customer_service">Customer Service</option>
            <option value="artist_manager">Artist Manager</option>
            <option value="admin">Admin</option>
          </select>
          <Button type="submit" disabled={inviting} className="shrink-0">
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
            {inviting ? "Saving…" : "Pre-Invite"}
          </Button>
        </form>

        {/* Pending invites list */}
        {!loadingInvites && invites.length > 0 && (
          <div className="mt-6 space-y-2">
            <p className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-2">
              Pending Invites ({invites.filter(i => !i.claimed_at).length} active)
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm ${
                    invite.claimed_at
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-border bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {invite.claimed_at ? (
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="truncate text-foreground">{invite.email}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                      {roleLabel(invite.role)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {invite.claimed_at ? (
                      <span className="text-xs text-green-500">Claimed</span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteInvite(invite.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Assign Role to Existing User */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-primary" />
          <h3 className="font-display text-sm uppercase tracking-wider text-foreground">Assign Role (Existing User)</h3>
        </div>
        <p className="text-xs text-muted-foreground font-body mb-4">
          For team members who already have an account. If they haven't signed up yet, use Pre-Invite above.
        </p>
        <form onSubmit={handleAssignRole} className="flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="existing@sullenclothing.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            className="flex-1 bg-secondary border-border"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as StaffRole)}
            className="h-10 rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
          >
            <option value="artist_manager">Artist Manager</option>
            <option value="customer_service">Customer Service</option>
            <option value="admin">Admin</option>
          </select>
          <Button type="submit" disabled={assigning} className="shrink-0">
            {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
            {assigning ? "Assigning…" : "Assign Role"}
          </Button>
        </form>
      </div>

      {/* Current Team Members */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-display text-sm uppercase tracking-wider text-foreground">Current Team Members</h3>
        </div>
        <p className="text-xs text-muted-foreground font-body mb-4">
          All users with assigned roles. Revoke access by removing their role.
        </p>
        {loadingTeam ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading team…
          </div>
        ) : teamMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team members with assigned roles.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="truncate text-foreground">
                    {member.email || member.user_id.slice(0, 8) + "…"}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                    {roleLabel(member.role)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevokeRole(member)}
                  disabled={revokingId === member.id}
                  className="h-7 gap-1 text-muted-foreground hover:text-destructive shrink-0"
                >
                  {revokingId === member.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline text-xs">Revoke</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-primary" />
          <h3 className="font-display text-sm uppercase tracking-wider text-foreground">Activity Log</h3>
        </div>
        <p className="text-xs text-muted-foreground font-body mb-4">
          Recent role changes — who did what and when.
        </p>
        {loadingAudit ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading activity…
          </div>
        ) : auditLog.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {auditLog.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm"
              >
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium text-xs uppercase tracking-wider ${actionColor(entry.action)}`}>
                      {actionLabel(entry.action)}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {roleLabel(entry.role)}
                    </span>
                    {entry.target_email && (
                      <span className="text-foreground truncate">→ {entry.target_email}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>by {entry.performer_email || entry.performed_by.slice(0, 8) + "…"}</span>
                    <span>•</span>
                    <span>{new Date(entry.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-primary" />
          <h3 className="font-display text-sm uppercase tracking-wider text-foreground">Send Password Reset</h3>
        </div>
        <p className="text-xs text-muted-foreground font-body mb-4">
          Send a password reset email to any team member. They'll receive a link to set a new password.
        </p>
        <form onSubmit={handleSendReset} className="flex gap-3">
          <Input
            type="email"
            placeholder="team@sullenclothing.com"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            required
            className="flex-1 bg-secondary border-border"
          />
          <Button type="submit" disabled={sending} className="shrink-0">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
            {sending ? "Sending…" : "Send Reset"}
          </Button>
        </form>
      </div>

      {/* Role Reference */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-display text-sm uppercase tracking-wider text-foreground">Role Reference</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="bg-secondary/50 rounded-md p-3">
            <p className="text-xs font-display uppercase tracking-wider text-foreground mb-1">Admin</p>
            <p className="text-xs text-muted-foreground font-body">Full access to all dashboard sections. Can delete artist profiles.</p>
          </div>
          <div className="bg-secondary/50 rounded-md p-3">
            <p className="text-xs font-display uppercase tracking-wider text-foreground mb-1">Artist Manager</p>
            <p className="text-xs text-muted-foreground font-body">Can only access Artist Profiles. Full edit access but cannot delete.</p>
          </div>
          <div className="bg-secondary/50 rounded-md p-3">
            <p className="text-xs font-display uppercase tracking-wider text-foreground mb-1">Customer Service</p>
            <p className="text-xs text-muted-foreground font-body">Rewards lookup, returns management, issue tracking, and reviews.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
