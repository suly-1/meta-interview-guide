/**
 * AdminInviteCodes — /admin/invite-codes
 * CRUD for invite codes: create, toggle active/blocked, delete.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { getAdminToken } from "@/components/AdminPinGate";
import { route } from "@/const";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  Key,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Users,
  ShieldOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const NAV_LINKS = [
  { href: route("/admin/feedback"), label: "Feedback" },
  { href: route("/admin/analytics"), label: "Analytics" },
  { href: route("/admin/access"), label: "Access" },
  { href: route("/admin/users"), label: "Users" },
  { href: route("/admin/stats"), label: "Stats" },
  { href: route("/admin/invite-codes"), label: "Invite Codes" },
  { href: route("/admin/sessions"), label: "Sessions" },
  { href: route("/admin/settings"), label: "Settings" },
];

export default function AdminInviteCodes() {
  const token = getAdminToken();
  const isAdmin = true;

  const { data: codes, refetch } = trpc.inviteGate.listCodes.useQuery(
    undefined,
    {
      enabled: isAdmin,
    }
  );

  const [newCode, setNewCode] = useState("");
  const [newCohort, setNewCohort] = useState("");
  const [newWelcome, setNewWelcome] = useState("");

  const createMutation = trpc.inviteGate.createCode.useMutation({
    onSuccess: () => {
      toast.success("Invite code created");
      setNewCode("");
      setNewCohort("");
      setNewWelcome("");
      refetch();
    },
    onError: e => toast.error(e.message),
  });

  const toggleMutation = trpc.inviteGate.toggleCode.useMutation({
    onSuccess: () => {
      toast.success("Code updated");
      refetch();
    },
    onError: e => toast.error(e.message),
  });

  const deleteMutation = trpc.inviteGate.deleteCode.useMutation({
    onSuccess: () => {
      toast.success("Code deleted");
      refetch();
    },
    onError: e => toast.error(e.message),
  });

  const revokeAllMutation = trpc.inviteGate.revokeAllForCode.useMutation({
    onSuccess: data => {
      toast.success(`Revoked ${data.revoked} session(s)`);
      refetch();
    },
    onError: e => toast.error(e.message),
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={route("/")}>
            <a className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={18} />
            </a>
          </Link>
          <Key size={18} className="text-blue-400" />
          <h1 className="text-lg font-semibold">Invite Codes</h1>
        </div>
        <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href}>
              <a className="hover:text-foreground transition-colors">
                {l.label}
              </a>
            </Link>
          ))}
        </nav>
      </header>

      <div className="container max-w-4xl py-8 space-y-6">
        {/* Create new code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus size={16} className="text-emerald-400" />
              Create New Invite Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="newCode" className="text-xs">
                  Code *
                </Label>
                <Input
                  id="newCode"
                  placeholder="METAENG2025"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value.toUpperCase())}
                  className="h-8 text-sm font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="newCohort" className="text-xs">
                  Cohort name
                </Label>
                <Input
                  id="newCohort"
                  placeholder="Batch 1"
                  value={newCohort}
                  onChange={e => setNewCohort(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="newWelcome" className="text-xs">
                  Welcome message
                </Label>
                <Input
                  id="newWelcome"
                  placeholder="Welcome to the guide!"
                  value={newWelcome}
                  onChange={e => setNewWelcome(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={() =>
                createMutation.mutate({
                  code: newCode,
                  cohortName: newCohort || undefined,
                  welcomeMessage: newWelcome || undefined,
                })
              }
              disabled={!newCode || createMutation.isPending}
            >
              <Plus size={14} className="mr-1" />
              Create Code
            </Button>
          </CardContent>
        </Card>

        {/* Code list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Key size={16} className="text-blue-400" />
              All Codes ({codes?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!codes || codes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No invite codes yet. Create one above.
              </p>
            ) : (
              <div className="space-y-2">
                {codes.map(code => (
                  <div
                    key={code.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20"
                  >
                    <div className="flex items-center gap-3">
                      <code className="text-sm font-mono font-bold text-foreground">
                        {code.code}
                      </code>
                      <Badge
                        variant={code.active ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {code.active ? "Active" : "Blocked"}
                      </Badge>
                      {code.cohortName && (
                        <span className="text-xs text-muted-foreground">
                          {code.cohortName}
                        </span>
                      )}
                      <span
                        className={`flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                          (code.sessionCount ?? 0) > 0
                            ? "bg-blue-500/15 text-blue-400"
                            : "text-muted-foreground"
                        }`}
                        title={`${code.sessionCount ?? 0} active session(s)`}
                      >
                        <Users size={11} />
                        {code.sessionCount ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() =>
                          toggleMutation.mutate({
                            id: code.id,
                            active: !code.active,
                          })
                        }
                      >
                        {code.active ? (
                          <>
                            <ToggleRight
                              size={14}
                              className="text-emerald-400"
                            />
                            Block
                          </>
                        ) : (
                          <>
                            <ToggleLeft
                              size={14}
                              className="text-muted-foreground"
                            />
                            Activate
                          </>
                        )}
                      </Button>
                      {(code.sessionCount ?? 0) > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs gap-1 text-amber-400 hover:text-amber-300"
                          title="Revoke all active sessions for this code"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Revoke all ${code.sessionCount} active session(s) for "${code.code}"? Users will be kicked out immediately.`
                              )
                            ) {
                              revokeAllMutation.mutate({ codeId: code.id });
                            }
                          }}
                          disabled={revokeAllMutation.isPending}
                        >
                          <ShieldOff size={13} />
                          Revoke all
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (window.confirm(`Delete code "${code.code}"?`)) {
                            deleteMutation.mutate({ id: code.id });
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
