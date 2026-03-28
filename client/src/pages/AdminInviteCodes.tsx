/**
 * AdminInviteCodes — manage invite codes and the access gate toggle.
 * Accessible at /#/admin/invite-codes (PIN-protected).
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Copy, RefreshCw, Lock, Unlock } from "lucide-react";

export default function AdminInviteCodes() {
  const utils = trpc.useUtils();

  const { data: gateStatus } = trpc.inviteGate.isEnabled.useQuery();
  const { data: codes, isLoading } = trpc.inviteGate.listCodes.useQuery();

  const setEnabled = trpc.inviteGate.setEnabled.useMutation({
    onSuccess: () => utils.inviteGate.isEnabled.invalidate(),
  });
  const createCode = trpc.inviteGate.createCode.useMutation({
    onSuccess: (data) => {
      toast.success(`Code created: ${data.code}`);
      utils.inviteGate.listCodes.invalidate();
      setNewCode("");
      setNewLabel("");
      setMaxUses(0);
    },
  });
  const deleteCode = trpc.inviteGate.deleteCode.useMutation({
    onSuccess: () => {
      toast.success("Code deleted");
      utils.inviteGate.listCodes.invalidate();
    },
  });

  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [maxUses, setMaxUses] = useState(0);

  const handleCreate = () => {
    createCode.mutate({
      code: newCode.trim() || undefined,
      label: newLabel.trim() || undefined,
      maxUses,
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard");
  };

  const gateEnabled = gateStatus?.enabled ?? false;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invite Gate</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Control who can access the site with invite codes.
        </p>
      </div>

      {/* Gate toggle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {gateEnabled ? (
              <Lock className="w-4 h-4 text-amber-500" />
            ) : (
              <Unlock className="w-4 h-4 text-emerald-500" />
            )}
            Access Gate
          </CardTitle>
          <CardDescription>
            When enabled, visitors must enter a valid invite code to access the
            site.
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
              {gateEnabled ? (
                <span className="text-amber-600">Invite-only mode ON</span>
              ) : (
                <span className="text-emerald-600">Open access (no gate)</span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Create new code */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Create Invite Code</CardTitle>
          <CardDescription>
            Leave the code field blank to auto-generate a random code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="Code (auto if blank)"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              className="font-mono uppercase"
              maxLength={32}
            />
            <Input
              placeholder="Label (optional)"
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
          </div>
          <Button
            onClick={handleCreate}
            disabled={createCode.isPending}
            className="mt-3"
            size="sm"
          >
            {createCode.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create Code
          </Button>
        </CardContent>
      </Card>

      {/* Code list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Active Codes</CardTitle>
          <CardDescription>
            {codes?.length ?? 0} code{codes?.length !== 1 ? "s" : ""} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !codes?.length ? (
            <p className="text-sm text-muted-foreground">
              No codes yet. Create one above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm">
                          {c.code}
                        </span>
                        <button
                          onClick={() => copyCode(c.code)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.label ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.useCount}
                      {c.maxUses ? ` / ${c.maxUses}` : " / ∞"}
                    </TableCell>
                    <TableCell>
                      {c.isActive ? (
                        <Badge variant="default" className="bg-emerald-600 text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteCode.mutate({ id: c.id })}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
