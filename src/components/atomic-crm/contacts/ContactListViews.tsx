import { useListContext, useTranslate } from "ra-core";
import { Button } from "@/components/ui/button";

const FAMILY_OFFICE_TAG_FILTER = "{2}";
const CTA_TAG_FILTER = "{36}";
const ALLOCATOR_TAG_FILTER = "{37}";

const VIEW_TAG_FILTERS = new Set([
  FAMILY_OFFICE_TAG_FILTER,
  CTA_TAG_FILTER,
  ALLOCATOR_TAG_FILTER,
]);

export type ContactViewId =
  | "all"
  | "new"
  | "contacted"
  | "qualified"
  | "family_office"
  | "cta"
  | "allocators"
  | "kanban";

const VIEWS: {
  id: ContactViewId;
  label: string;
  fallback: string;
}[] = [
  { id: "all", label: "resources.contacts.views.all", fallback: "All" },
  { id: "new", label: "resources.contacts.views.new", fallback: "New" },
  {
    id: "contacted",
    label: "resources.contacts.views.contacted",
    fallback: "Contacted",
  },
  {
    id: "qualified",
    label: "resources.contacts.views.qualified",
    fallback: "Qualified",
  },
  {
    id: "family_office",
    label: "resources.contacts.views.family_office",
    fallback: "Family office",
  },
  {
    id: "cta",
    label: "resources.contacts.views.cta",
    fallback: "CTA / STMS",
  },
  {
    id: "allocators",
    label: "resources.contacts.views.allocators",
    fallback: "Allocators",
  },
  {
    id: "kanban",
    label: "resources.contacts.views.kanban",
    fallback: "Kanban",
  },
];

export const getActiveContactView = (
  filterValues: Record<string, unknown> | undefined,
  isKanban: boolean,
): ContactViewId => {
  if (isKanban) return "kanban";
  if (filterValues?.status === "new") return "new";
  if (filterValues?.status === "contacted") return "contacted";
  if (filterValues?.status === "qualified") return "qualified";
  if (filterValues?.["tags@cs"] === FAMILY_OFFICE_TAG_FILTER) {
    return "family_office";
  }
  if (filterValues?.["tags@cs"] === CTA_TAG_FILTER) {
    return "cta";
  }
  if (filterValues?.["tags@cs"] === ALLOCATOR_TAG_FILTER) {
    return "allocators";
  }
  return "all";
};

export const ContactListViews = ({
  isKanban,
  onKanbanChange,
}: {
  isKanban: boolean;
  onKanbanChange: (value: boolean) => void;
}) => {
  const translate = useTranslate();
  const { filterValues, setFilters, setPerPage } = useListContext();
  const activeView = getActiveContactView(filterValues, isKanban);

  const applyView = (view: ContactViewId) => {
    const nextFilters = { ...(filterValues || {}) };
    delete nextFilters.status;
    if (VIEW_TAG_FILTERS.has(String(nextFilters["tags@cs"]))) {
      delete nextFilters["tags@cs"];
    }

    if (view === "new") nextFilters.status = "new";
    if (view === "contacted") nextFilters.status = "contacted";
    if (view === "qualified") nextFilters.status = "qualified";
    if (view === "family_office") {
      nextFilters["tags@cs"] = FAMILY_OFFICE_TAG_FILTER;
    }
    if (view === "cta") {
      nextFilters["tags@cs"] = CTA_TAG_FILTER;
    }
    if (view === "allocators") {
      nextFilters["tags@cs"] = ALLOCATOR_TAG_FILTER;
    }

    onKanbanChange(view === "kanban");
    setPerPage(view === "kanban" ? 100 : 25);
    setFilters(nextFilters);
  };

  return (
    <div className="flex flex-wrap gap-1">
      {VIEWS.map((view) => (
        <Button
          key={view.id}
          type="button"
          size="sm"
          variant={activeView === view.id ? "secondary" : "ghost"}
          className="h-8"
          onClick={() => applyView(view.id)}
        >
          {translate(view.label, { _: view.fallback })}
        </Button>
      ))}
    </div>
  );
};
