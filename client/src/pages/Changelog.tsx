/**
 * Changelog — /changelog
 * Public page showing the deployment history from /api/changelog/history.
 */
import { useState, useEffect } from "react";
import { route } from "@/const";
import { Link } from "wouter";
import { ArrowLeft, Zap, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ChangelogEntry {
  hash: string;
  date: string;
  title: string;
  items: string[];
}

export default function Changelog() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/changelog/history")
      .then(r => r.json())
      .then((data: ChangelogEntry[]) => {
        setEntries(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <Link href={route("/")}>
          <a className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
          </a>
        </Link>
        <Zap size={18} className="text-blue-400" />
        <h1 className="text-lg font-semibold">Changelog</h1>
      </header>

      <div className="container max-w-2xl py-10 space-y-6">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-16">
            Loading…
          </p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-16">
            No changelog entries yet.
          </p>
        ) : (
          entries.map((entry, i) => (
            <Card
              key={entry.hash}
              className={i === 0 ? "border-blue-500/30" : ""}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {i === 0 && (
                      <Badge className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                        Latest
                      </Badge>
                    )}
                    {entry.title}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {entry.date}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {entry.items.map((item, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2
                        size={14}
                        className="text-emerald-400 shrink-0 mt-0.5"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground/40 font-mono mt-3">
                  {entry.hash}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
