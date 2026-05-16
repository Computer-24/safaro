"use client";

import InboxButton from "@/components/admin/InboxButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clipboard, FileText, Inbox, Search, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CreateTicketModal } from "./CreateTicketModal";

type ItemType = "ticket" | "investigation" | "action" | "verification";

type Severity = "Critical" | "High" | "Medium" | "Low";

type WorkItem = {
  id: string;
  type: ItemType;
  ticketId?: string | null;
  investigationId?: string | null;
  actionId?: string | null;
  title: string;
  summary?: string;
  reporter?: string;
  owner?: string;
  verifier?: string | null;
  severity?: Severity;
  dueDate?: string | null; // ISO string
  assignedAuto?: boolean;
  createdAt: string; // ISO string
  isNew?: boolean;
};

// --- Mock data ---
const MOCK_ITEMS: WorkItem[] = [
  { id: "T-2001", type: "ticket", title: "Payments failing intermittently", summary: "Errors in payment gateway", reporter: "Samira Khan", owner: "Aisha", severity: "Critical", assignedAuto: true, createdAt: "2026-05-09T08:00:00Z", investigationId: "I-900", isNew: true },
  { id: "I-900", type: "investigation", title: "Payments outage RCA", summary: "Investigate retry logic and API keys", reporter: "Aisha", owner: "Rashid", severity: "High", assignedAuto: false, createdAt: "2026-05-09T09:00:00Z", isNew: true },
  { id: "A-400", type: "action", title: "Rotate API keys", summary: "Rotate keys for payment provider", owner: "Maya", verifier: "Hassan", severity: "Medium", dueDate: "2026-05-12", createdAt: "2026-05-09T10:00:00Z", actionId: "A-400", investigationId: "I-900", isNew: false },
  { id: "V-700", type: "verification", title: "Verify rotated keys", summary: "Confirm new keys in production", owner: "Hassan", verifier: "Rashid", severity: "Medium", createdAt: "2026-05-10T09:00:00Z", isNew: false },
  { id: "T-2002", type: "ticket", title: "Invoice totals mismatch", summary: "Rounding issue in billing", reporter: "Omar Aziz", owner: "Hassan", severity: "High", assignedAuto: true, createdAt: "2026-05-08T12:30:00Z", isNew: false },
];

// --- Shared badge token so all badges look identical ---
const badgeBase = "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded";

function typeBadge(itemType: ItemType) {
  switch (itemType) {
    case "ticket": return { label: "Ticket", className: `${badgeBase} bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200` };
    case "investigation": return { label: "Investigation", className: `${badgeBase} bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200` };
    case "action": return { label: "Action", className: `${badgeBase} bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200` };
    case "verification": return { label: "Verify", className: `${badgeBase} bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200` };
  }
}
function severityBadgeProps(sev?: WorkItem["severity"]) {
  if (!sev) return { label: "—", variantClass: `${badgeBase} bg-transparent text-muted-foreground` };
  if (sev === "Critical") return { label: "Critical", variantClass: `${badgeBase} bg-red-600 text-white` };
  if (sev === "High") return { label: "High", variantClass: `${badgeBase} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300` };
  return { label: sev, variantClass: `${badgeBase} bg-slate-100 text-foreground dark:bg-slate-800 dark:text-slate-200` };
}



export default function Workspace() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(MOCK_ITEMS[0].id);
  const [items, setItems] = useState<WorkItem[]>(MOCK_ITEMS);
  const [showOnlyNew, setShowOnlyNew] = useState(false);
  const [filterType, setFilterType] = useState<ItemType | "all" | null>(null);
  const [myWorkSelected, setMyWorkSelected] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const counts = useMemo(() => ({
    tickets: items.filter(i => i.type === "ticket").length,
    investigations: items.filter(i => i.type === "investigation").length,
    actions: items.filter(i => i.type === "action").length,
    verifications: items.filter(i => i.type === "verification").length,
    mySubmitted: items.filter(i => i.reporter === "Samira Khan").length,
    newCount: items.filter(i => i.isNew).length,
    newTickets: items.filter(i => i.type === "ticket" && i.isNew).length,
    newInvestigations: items.filter(i => i.type === "investigation" && i.isNew).length,
    newActions: items.filter(i => i.type === "action" && i.isNew).length,
    newVerifications: items.filter(i => i.type === "verification" && i.isNew).length,
  }), [items]);

  // filtering: respects filterType and showOnlyNew and search query
  const filtered = items
    .filter(i => {
      if (filterType && filterType !== "all") return i.type === filterType;
      return true;
    })
    .filter(i => (myWorkSelected ? i.reporter === "Samira Khan" : true))
    .filter(i => (showOnlyNew ? i.isNew : true))
    .filter(i => {
      const text = `${i.title} ${i.summary ?? ""} ${i.id} ${i.reporter ?? ""} ${i.owner ?? ""}`.toLowerCase();
      return text.includes(query.toLowerCase());
    })
    .sort((a, b) => {
      if ((a.isNew ? 1 : 0) !== (b.isNew ? 1 : 0)) return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
  const handleMarkRead = (id: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, isNew: false } : it));
  };
  const toggleSelect = (id: string) => {
    setSelectedId(prev => {
      if (prev === id) {
        handleMarkRead(id);
        return null;
      }
      return id;
    });
  };

  const selected = items.find(i => i.id === selectedId) ?? null;

  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);


  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden py-6">
      <div className="max-w-10xl mx-4 px-0 py-2 pb-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold">My Workspace</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile search button */}
            <Button size="sm" variant="ghost" className="sm:hidden" onClick={() => setShowMobileSearch(s => !s)}>
              <Search className="h-4 w-4" />
            </Button>

            <div className="hidden sm:flex items-center gap-2 rounded-md bg-muted px-2 py-1">
              <Input
                placeholder="Search items, reporters, ids..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-[320px] bg-transparent border-0 focus:ring-0 text-foreground placeholder:text-muted-foreground"
              />
              <Button size="sm" variant="outline" onClick={() => { }} className="border">
                <Search className="h-4 w-4" />
              </Button>
            </div>
              <CreateTicketModal />
          </div>

          {/* Mobile search input (collapsible) */}
          {showMobileSearch ? (
            <div className="sm:hidden mt-2 w-full">
              <Input
                placeholder="Search items, reporters, ids..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-muted/20 border border-border focus:ring-0 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          ) : null}
        </div>

        {/* Grid: 6 columns -> left 1, center 2, right 3 */}
        <div className="grid grid-cols-12 gap-3 flex-1 overflow-hidden min-h-0 h-full">
          {/* Left rail */}
          <aside className="col-span-12 sm:col-span-2 space-y-3 pl-0 h-full">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm"><Inbox className="h-4 w-4" /> Inbox</CardTitle>
              </CardHeader>

              <CardContent className="space-y-2 flex-1">
                <InboxButton
                  type="ticket"
                  label={<><FileText className="h-4 w-4" /> Tickets</>}
                  count={counts.newTickets}
                  active={filterType === 'ticket'}
                  onClick={() => { setFilterType('ticket'); setShowOnlyNew(false); setMyWorkSelected(false); setQuery(''); setSelectedId(null); }}
                />
                <InboxButton
                  type="investigation"
                  label={<><Clipboard className="h-4 w-4" /> Investigations</>}
                  count={counts.newInvestigations}
                  active={filterType === 'investigation'}
                  onClick={() => { setFilterType('investigation'); setShowOnlyNew(false); setMyWorkSelected(false); setQuery(''); setSelectedId(null); }}
                />
                <InboxButton
                  type="action"
                  label={<><Users className="h-4 w-4" /> Actions</>}
                  count={counts.newActions}
                  active={filterType === 'action'}
                  onClick={() => { setFilterType('action'); setShowOnlyNew(false); setMyWorkSelected(false); setQuery(''); setSelectedId(null); }}
                />
                <InboxButton
                  type="verification"
                  label={<><CheckCircle className="h-4 w-4" /> Verifications</>}
                  count={counts.newVerifications}
                  active={filterType === 'verification'}
                  onClick={() => { setFilterType('verification'); setShowOnlyNew(false); setMyWorkSelected(false); setQuery(''); setSelectedId(null); }}
                />

                <Separator />

                {/* New items toggle placed inside Inbox card (left column) */}
                <Button
                  variant={showOnlyNew ? "default" : "outline"}
                  className="w-full justify-between"
                  onClick={() => {
                    setShowOnlyNew(s => {
                      const next = !s;
                      if (next) {
                        setFilterType(null);
                        setMyWorkSelected(false);
                        setQuery("");
                        setSelectedId(null);
                      }
                      return next;
                    });
                  }}
                >
                  <span>New items</span>
                  {counts.newCount > 0 ? <Badge variant="new">{counts.newCount}</Badge> : null}
                </Button>

                {/* All items uses same Button shape as New items */}
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  className="w-full justify-between"
                  onClick={() => { setFilterType("all"); setShowOnlyNew(false); setMyWorkSelected(false); setQuery(""); setSelectedId(null); }}
                >
                  <span>All items</span>
                  <Badge>{items.length}</Badge>
                </Button>
                <Button
                  variant={myWorkSelected ? "default" : "outline"}
                  className="w-full justify-between"
                  onClick={() => {
                    setMyWorkSelected(prev => {
                      const next = !prev;
                      if (next) {
                        setFilterType(null);
                        setShowOnlyNew(false);
                        setQuery("");
                        setSelectedId(null);
                      }
                      return next;
                    });
                  }}
                >
                  <span>My Work</span>
                  <Badge>{counts.mySubmitted}</Badge>
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Center worklist */}
          <main className="col-span-12 sm:col-span-4 h-full min-h-0">
            <Card className="h-full min-h-0 flex flex-col">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-sm">Unified Worklist</CardTitle>
                <div className="text-sm text-muted-foreground">Showing {filtered.length} items</div>
              </CardHeader>
              <CardContent className="p-4 h-full min-h-0 flex-1">
                <ScrollArea className="h-full">
                  <div className="divide-y rounded-md h-full pb-6">
                    {filtered.length === 0 ? (
                      <div className="flex items-center justify-center h-80 text-muted-foreground">
                        No items match your filters
                      </div>
                    ) : (
                      filtered.map(item => {
                        const tb = typeBadge(item.type);
                        const sev = severityBadgeProps(item.severity);
                        const selectedBg = selectedId === item.id ? "bg-muted" : "bg-transparent";

                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleSelect(item.id)}
                            className={`grid grid-cols-24 items-center gap-1 cursor-pointer px-1 py-2 ${selectedBg} hover:bg-muted/50`}
                          >
                            {/* 2/24: dot indicator (slightly padded left) */}
                            <div className="col-span-2 flex items-center justify-start pl-2">
                              {item.isNew ? (
                                <span className="h-2 w-2 rounded-full bg-emerald-400 dark:bg-emerald-300" aria-hidden />
                              ) : (
                                <span className="h-2 w-2 rounded-full bg-transparent" aria-hidden />
                              )}
                            </div>

                            {/* 5/24: category badge (immediately right of dot, no outer gap) */}
                            <div className="col-span-5 flex items-center pl-0">
                              <span className={`${tb.className} text-center`}>{tb.label}</span>
                            </div>

                            {/* 16/24: description + right aligned severity */}
                            <div className="col-span-16 flex items-center justify-between min-w-0">
                              <div className="min-w-0 pr-2">
                                <div className={`${item.isNew ? "font-semibold" : "font-normal"} text-sm truncate`}>
                                  {item.title}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {item.id} • {item.reporter ?? item.owner ?? "—"} • {item.summary ?? ""}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="w-20 flex justify-end">
                                  <span className={sev.variantClass}>{sev.label}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </main>

          {/* Right details */}
          <section className="col-span-12 sm:col-span-6 pr-0 h-full min-h-0">
            {selected ? (
              <Card className="h-full min-h-0 flex flex-col">
                <CardHeader>
                  <CardTitle className="text-sm">Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4 h-full min-h-0 flex-1">
                  <ScrollArea className="h-full">
                    <div className="space-y-4 pb-6">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selected.reporter ?? selected.owner ?? "User")}`} />
                          <AvatarFallback>{(selected.reporter ?? selected.owner ?? "U").slice(0, 2)}</AvatarFallback>
                        </Avatar>

                        <div>
                          <div className="text-lg font-semibold">{selected.title}</div>
                          <div className="text-xs text-muted-foreground">{selected.id} • {selected.type} • {new Date(selected.createdAt).toLocaleString()}</div>
                        </div>
                      </div>

                        <div className="text-sm text-muted-foreground">{selected.summary}</div>

                      <div className="flex items-center gap-2">
                        <span className={typeBadge(selected.type).className}>{typeBadge(selected.type).label}</span>
                        <span className={severityBadgeProps(selected.severity).variantClass}>{severityBadgeProps(selected.severity).label}</span>
                        {selected.assignedAuto ? <Badge>Auto</Badge> : <Badge variant="outline">Manual</Badge>}
                        {selected.isNew ? <Button size="sm" variant="ghost" onClick={() => handleMarkRead(selected.id)}>Mark read</Button> : null}
                      </div>

                      <Tabs defaultValue="details">
                        <TabsList className="mt-2">
                          <TabsTrigger value="details">Details</TabsTrigger>
                          <TabsTrigger value="actions">Actions</TabsTrigger>
                          <TabsTrigger value="timeline">Timeline</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="mt-3">
                          <div className="space-y-2 text-muted-foreground">
                            <div><strong>Reporter</strong>: {selected.reporter ?? "—"}</div>
                            <div><strong>Owner</strong>: {selected.owner ?? "—"}</div>
                            <div><strong>Verifier</strong>: {selected.verifier ?? "—"}</div>
                            <div><strong>Due</strong>: {selected.dueDate ?? "—"}</div>
                          </div>
                        </TabsContent>

                        <TabsContent value="timeline" className="mt-3">
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div>2026-05-09 09:00 — Item created</div>
                            <div>2026-05-09 10:30 — Assigned to pool</div>
                            <div>2026-05-10 11:00 — Action created</div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </ScrollArea>
              </CardContent>
                
              </Card>
            ) : (
              <Card className="h-full min-h-0">
                <CardHeader>
                  <CardTitle className="text-sm">Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4 h-full min-h-0">
                  <ScrollArea className="h-full">
                    <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
                      <Inbox className="h-8 w-8 text-muted-foreground" />
                      <div className="text-sm">Details are hidden. Click an item in the worklist to open details here.</div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
