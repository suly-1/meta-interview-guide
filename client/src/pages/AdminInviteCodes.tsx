/**
 * AdminInviteCodes — manage invite codes and the access gate toggle.
 * Features:
 *  - Gate on/off toggle
 *  - Create codes with custom access window (days)
 *  - Per-code block/unblock (instant effect)
 *  - Per-code expiry window display (firstUsedAt + accessWindowDays)
 *  - Extend access window per code
 *  - Attempt log with IP masking
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Plus, Trash2, Copy, RefreshCw, Lock, Unlock,
  ShieldBan, ShieldCheck, CalendarPlus, Clock, AlertTriangle,
} from "lucide-react";

type CodeRow = {
  id: number;
  code: string;
  label: string | null;
  welcomeMessage: string | null;
  maxUses: number | null;
  useCount: number;
  isActive: number;
  isBlocked: number;
  createdAt: Date;
  firstUsedAt: Date | null;
  accessWindowDays: number | null;
  windowExpiresAt: string | null;
  isWindowExpired: boolean;
  isAbsoluteExpired: boolean;
  effectivelyExpired: boolean;
};

export default function AdminInviteCodes() {
  const utils = trpc.useUtils();

  const { data: gateStatus } = trpc.inviteGate.isEnabled.useQuery();
  const { data: codes, isLoading } = trpc.inviteGate.listCodes.useQuery();
  const { data: attempts, isLoading: attemptsLoading, refetch: refetchAttempts } =
    trpc.inviteGate.listAttempts.useQuery({ limit: 50 });

  const setEnabled = trpc.inviteGate.setEnabled.useMutation({
    onSuccess: () => utils.inviteGate.isEnabled.invalidate(),
  });

  const createCode = trpc.inviteGate.createCode.useMutation({
    onSuccess: (data) => {
      toast.success(`Code created: ${data.code}`);
      utils.inviteGate.listCodes.invalidate();
      setNewCode(""); setNewLabel(""); setMaxUses(0); setWindowDays(60);
    },
  });

  const deleteCode = trpc.inviteGate.deleteCode.useMutation({
    onSuccess: () => { toast.success("Code deleted"); utils.inviteGate.listCodes.invalidate(); },
  });

  const blockCode = trpc.inviteGate.blockCode.useMutation({
    onSuccess: (_, vars) => {
      toast.success("Code blocked — user locked out immediately");
      utils.inviteGate.listCodes.invalidate();
      setConfirmBlock(null);
    },
  });

  const unblockCode = trpc.inviteGate.unblockCode.useMutation({
    onSuccess: () => { toast.success("Code unblocked — user regains access"); utils.inviteGate.listCodes.invalidate(); },
  });

  const extendAccess = trpc.inviteGate.extendAccess.useMutation({
    onSuccess: () => { toast.success("Access window updated"); utils.inviteGate.listCodes.invalidate(); setExtendTarget(null); },
  });

  const clearAttempts = trpc.inviteGate.clearAttempts.useMutation({
    onSuccess: () => { toast.success("Attempt log cleared"); refetchAttempts(); },
  });

  // Form state
  const [newCode, setNewCode]     = useState("");
  const [newLabel, setNewLabel]   = useState("");
  const [maxUses, setMaxUses]     = useState(0);
  const [windowDays, setWindowDays] = useState(60);

  // Confirm block modal
  const [confirmBlock, setConfirmBlock] = useState<CodeRow | null>(null);

  // Extend access modal
  const [extendTarget, setExtendTarget] = useState<CodeRow | null>(null);
  const [extendDays, setExtendDays]     = useState(30);

  const gateEnabled = gateStatus?.enabled ?? false;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard");
  };

  const formatExpiry = (iso: string | null) => {
    if (!iso) return "Never";
    const d = new Date(iso);
    const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
    if (diff < 0) return `Expired ${Math.abs(diff)}d ago`;
    if (diff === 0) return "Expires today";
    return `${new Date(iso).toLocaleDateString()} (${diff}d left)`;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invite Gate</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Control who can access the site. Block individual codes instantly without affecting others.
        </p>
      </div>

      {/* Gate toggle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {gateEnabled ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4 text-emerald-500" />}
            Access Gate
          </CardTitle>
          <CardDescription>
            When enabled, visitors must enter a valid invite code to access the site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              checked={gateEnabled}
              onCheckedChange={(v) => {
                setEnabled.mutate({ enabled: v });
                toast.success(v ? "Gate enabled — site is now invite-only" : "Gate disabled — site is publicly accessible");
              }}
            />
            <span className="text-sm font-medium">
              {gateEnabled
                ? <span className="text-amber-600">Invite-only mode ON</span>
                : <span className="text-emerald-600">Open access (no gate)</span>}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Create new code */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Create Invite Code</CardTitle>
          <CardDescription>
            Leave the code field blank to auto-generate. Access window starts from first use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder="Code (auto if blank)"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              className="font-mono uppercase"
              maxLength={32}
            />
            <Input
              placeholder="Label (e.g. Cohort Jan 2026)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              maxLength={128}
            />
            <Input
              type="number"
              placeholder="Max uses (0 = unlimited)"
              value={maxUses}
              onChange={(e) => setMaxUses(parseInt(e.target.value) || 0)}
              min={0}
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Access window (days)"
                value={windowDays}
                onChange={(e) => setWindowDays(parseInt(e.target.value) || 0)}
                min={0}
                max={730}
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">days</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Access window: 0 = no expiry. Otherwise the code expires N days after first use.
          </p>
          <Button
            onClick={() => createCode.mutate({
              code: newCode.trim() || undefined,
              label: newLabel.trim() || undefined,
              maxUses,
              accessWindowDays: windowDays,
            })}
            disabled={createCode.isPending}
            className="mt-3"
            size="sm"
          >
            {createCode.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Code
          </Button>
        </CardContent>
      </Card>

      {/* Code list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Invite Codes</CardTitle>
          <CardDescription>
            {codes?.length ?? 0} code{codes?.length !== 1 ? "s" : ""} total.
            Block a code to instantly lock out that specific user.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !codes?.length ? (
            <p className="text-sm text-muted-foreground">No codes yet. Create one above.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Access Window</TableHead>
                  <TableHead>First Used</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(codes as CodeRow[]).map((c) => (
                  <TableRow key={c.id} className={c.isBlocked ? "opacity-60" : ""}>
                    {/* Code */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm">{c.code}</span>
                        <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-foreground">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </TableCell>

                    {/* Label */}
                    <TableCell className="text-sm text-muted-foreground max-w-[140px] truncate">
                      {c.label ?? "—"}
                    </TableCell>

                    {/* Uses */}
                    <TableCell className="text-sm">
                      {c.useCount}{c.maxUses ? ` / ${c.maxUses}` : " / ∞"}
                    </TableCell>

                    {/* Status badges */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {c.isBlocked ? (
                          <Badge variant="destructive" className="text-xs w-fit">
                            <ShieldBan className="w-3 h-3 mr-1" /> Blocked
                          </Badge>
                        ) : c.effectivelyExpired ? (
                          <Badge variant="secondary" className="text-xs w-fit bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                            <Clock className="w-3 h-3 mr-1" /> Expired
                          </Badge>
                        ) : c.isActive ? (
                          <Badge variant="default" className="text-xs w-fit bg-emerald-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs w-fit">Inactive</Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Access window */}
                    <TableCell className="text-xs">
                      {c.accessWindowDays === 0 ? (
                        <span className="text-muted-foreground">No expiry</span>
                      ) : c.windowExpiresAt ? (
                        <span className={c.isWindowExpired ? "text-orange-500 font-medium" : "text-muted-foreground"}>
                          {formatExpiry(c.windowExpiresAt)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {c.accessWindowDays}d from first use
                        </span>
                      )}
                    </TableCell>

                    {/* First used */}
                    <TableCell className="text-xs text-muted-foreground">
                      {c.firstUsedAt ? new Date(c.firstUsedAt).toLocaleDateString() : "Not yet used"}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {/* Block / Unblock */}
                        {c.isBlocked ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Unblock — restore access"
                            className="text-emerald-600 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            onClick={() => unblockCode.mutate({ id: c.id })}
                            disabled={unblockCode.isPending}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Block — lock out this user immediately"
                            className="text-red-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => setConfirmBlock(c)}
                          >
                            <ShieldBan className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {/* Extend access */}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Extend / reset access window"
                          className="text-blue-500 hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          onClick={() => { setExtendTarget(c); setExtendDays(30); }}
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                        </Button>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete code permanently"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteCode.mutate({ id: c.id })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Attempt log */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Attempt Log</CardTitle>
              <CardDescription>Last 50 invite code attempts (success + failures)</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => refetchAttempts()}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => clearAttempts.mutate({ olderThanDays: 0 })}
                disabled={clearAttempts.isPending}
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {attemptsLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !attempts?.length ? (
            <p className="text-sm text-muted-foreground">No attempts recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Code Tried</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(a.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{a.ipMasked}</TableCell>
                    <TableCell className="font-mono text-xs font-bold">{a.submittedCode}</TableCell>
                    <TableCell>
                      {a.success ? (
                        <Badge variant="default" className="text-xs bg-emerald-600">Success</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">Failed</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Block confirmation modal ─────────────────────────────────────────── */}
      {confirmBlock && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-destructive/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                <ShieldBan className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold">Block this code?</h3>
                <p className="text-sm text-muted-foreground">
                  Code <span className="font-mono font-bold">{confirmBlock.code}</span>
                  {confirmBlock.label ? ` (${confirmBlock.label})` : ""} will be blocked immediately.
                  The user will be locked out on their next page load.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmBlock(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => blockCode.mutate({ id: confirmBlock.id })}
                disabled={blockCode.isPending}
              >
                {blockCode.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <ShieldBan className="w-4 h-4 mr-2" />}
                Block Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Extend access modal ──────────────────────────────────────────────── */}
      {extendTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <CalendarPlus className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold">Extend Access</h3>
                <p className="text-sm text-muted-foreground">
                  Code <span className="font-mono font-bold">{extendTarget.code}</span>
                  {extendTarget.windowExpiresAt
                    ? ` — currently expires ${new Date(extendTarget.windowExpiresAt).toLocaleDateString()}`
                    : extendTarget.firstUsedAt
                    ? " — window active"
                    : " — not yet used"}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Extend by (days)</label>
                <Input
                  type="number"
                  value={extendDays}
                  onChange={(e) => setExtendDays(parseInt(e.target.value) || 0)}
                  min={1}
                  max={730}
                  placeholder="e.g. 30"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => extendAccess.mutate({ id: extendTarget.id, extendDays })}
                disabled={extendAccess.isPending || extendDays < 1}
                className="w-full"
              >
                <CalendarPlus className="w-4 h-4 mr-2" />
                Add {extendDays} Days
              </Button>
              <Button
                variant="outline"
                onClick={() => extendAccess.mutate({ id: extendTarget.id, resetWindow: true })}
                disabled={extendAccess.isPending}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Window (fresh {extendTarget.accessWindowDays ?? 60} days on next use)
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setExtendTarget(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
