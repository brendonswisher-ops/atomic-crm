import { Hourglass } from "lucide-react";
import { useMemo } from "react";
import { useGetList, useTranslate } from "ra-core";
import { Link } from "react-router";
import { Card } from "@/components/ui/card";

import type { Contact, ContactNote, Deal, DealNote } from "../types";

const STALE_MS = 14 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const StaleIntros = () => {
  const translate = useTranslate();
  const {
    data: introDeals,
    total: introTotal,
    isPending: introsPending,
  } = useGetList<Deal>("deals", {
    pagination: { page: 1, perPage: 50 },
    sort: { field: "updated_at", order: "ASC" },
    filter: { stage: "intro", "archived_at@is": null },
  });

  const contactIds = useMemo(() => {
    const ids = new Set<string | number>();
    introDeals?.forEach((deal) => {
      deal.contact_ids?.forEach((id) => ids.add(id));
    });
    return Array.from(ids);
  }, [introDeals]);

  const dealIds = useMemo(
    () => introDeals?.map((deal) => deal.id) ?? [],
    [introDeals],
  );

  const { data: contacts, isPending: contactsPending } = useGetList<Contact>(
    "contacts",
    {
      pagination: { page: 1, perPage: 100 },
      filter: { "id@in": `(${contactIds.join(",")})` },
    },
    { enabled: contactIds.length > 0 },
  );

  const { data: dealNotes, isPending: dealNotesPending } = useGetList<DealNote>(
    "deal_notes",
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "date", order: "DESC" },
      filter: { "deal_id@in": `(${dealIds.join(",")})` },
    },
    { enabled: dealIds.length > 0 },
  );

  const { data: contactNotes, isPending: contactNotesPending } =
    useGetList<ContactNote>(
      "contact_notes",
      {
        pagination: { page: 1, perPage: 100 },
        sort: { field: "date", order: "DESC" },
        filter: { "contact_id@in": `(${contactIds.join(",")})` },
      },
      { enabled: contactIds.length > 0 },
    );

  const relatedPending =
    (contactIds.length > 0 && contactsPending) ||
    (dealIds.length > 0 && dealNotesPending) ||
    (contactIds.length > 0 && contactNotesPending);

  const staleDeals = useMemo(() => {
    if (!introDeals?.length) return [];
    const now = Date.now();
    const contactsById = new Map((contacts ?? []).map((c) => [c.id, c]));
    const notesByDeal = new Map<Deal["id"], DealNote[]>();
    for (const note of dealNotes ?? []) {
      const list = notesByDeal.get(note.deal_id) ?? [];
      list.push(note);
      notesByDeal.set(note.deal_id, list);
    }
    const notesByContact = new Map<Contact["id"], ContactNote[]>();
    for (const note of contactNotes ?? []) {
      const list = notesByContact.get(note.contact_id) ?? [];
      list.push(note);
      notesByContact.set(note.contact_id, list);
    }

    return introDeals
      .map((deal) => {
        let latest = 0;
        const consider = (iso?: string | null) => {
          if (!iso) return;
          const t = new Date(iso).getTime();
          if (!Number.isNaN(t) && t > latest) latest = t;
        };
        consider(deal.updated_at);
        consider(deal.created_at);
        for (const id of deal.contact_ids ?? []) {
          consider(contactsById.get(id)?.last_seen);
          notesByContact.get(id)?.forEach((n) => consider(n.date));
        }
        notesByDeal.get(deal.id)?.forEach((n) => consider(n.date));
        const daysIdle =
          latest > 0 ? Math.floor((now - latest) / DAY_MS) : 14;
        return { deal, latest, daysIdle };
      })
      .filter((row) => row.latest === 0 || now - row.latest >= STALE_MS)
      .sort((a, b) => a.latest - b.latest)
      .slice(0, 8);
  }, [introDeals, contacts, dealNotes, contactNotes]);

  const isPending = introsPending || relatedPending;
  const emptyMessage =
    !introsPending && (introTotal ?? 0) === 0
      ? translate("crm.dashboard.stale_intros_empty", {
          _: "No intro deals.",
        })
      : translate("crm.dashboard.stale_intros_none", {
          _: "No intros idle for 14 days.",
        });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center">
        <div className="mr-3 flex">
          <Hourglass className="text-muted-foreground w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-muted-foreground">
          {translate("crm.dashboard.stale_intros", { _: "Stale intros" })}
        </h2>
      </div>
      <Card className="py-0">
        {isPending ? (
          <div className="p-4 text-sm text-muted-foreground">
            {translate("crm.common.loading", { _: "Loading..." })}
          </div>
        ) : staleDeals.length ? (
          <ul className="divide-y">
            {staleDeals.map(({ deal, daysIdle }) => (
              <li key={deal.id}>
                <Link
                  to={`/deals/${deal.id}/show`}
                  className="flex justify-between gap-3 px-4 py-3 hover:bg-muted transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{deal.name}</p>
                    {deal.category ? (
                      <p className="text-xs text-muted-foreground truncate uppercase tracking-wide">
                        {deal.category}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {translate("crm.dashboard.stale_intros_days", {
                      days: daysIdle,
                      _: `${daysIdle}d idle`,
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4">
            <p className="text-sm">{emptyMessage}</p>
          </div>
        )}
      </Card>
    </div>
  );
};
