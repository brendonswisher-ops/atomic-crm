import { useMemo } from "react";
import { useGetList, useTranslate } from "ra-core";
import { Link } from "react-router";

import { findDealLabel } from "../deals/dealUtils";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";

const SNAPSHOT_STAGES = ["intro", "qep", "ppm", "closed"] as const;

export const PipelineSnapshot = () => {
  const translate = useTranslate();
  const { dealStages } = useConfigurationContext();
  const { data, isPending } = useGetList<Deal>("deals", {
    pagination: { page: 1, perPage: 200 },
    filter: { "archived_at@is": null },
  });

  const { counts, stmsCount, total } = useMemo(() => {
    const deals = data ?? [];
    const counts: Record<string, number> = {};
    for (const stage of SNAPSHOT_STAGES) {
      counts[stage] = 0;
    }
    let stms = 0;
    for (const deal of deals) {
      if (counts[deal.stage] !== undefined) {
        counts[deal.stage] += 1;
      }
      if (deal.category === "stms") {
        stms += 1;
      }
    }
    return { counts, stmsCount: stms, total: deals.length };
  }, [data]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold text-white">
          {translate("crm.dashboard.pipeline_snapshot", { _: "Pipeline" })}
        </h2>
        {!isPending && total > 0 ? (
          <p className="text-xs text-[#8B9DB8]">
            {stmsCount > 0
              ? translate("crm.dashboard.pipeline_stms_of_total", {
                  stms: stmsCount,
                  total,
                  _: `${stmsCount} STMS of ${total}`,
                })
              : translate("crm.dashboard.pipeline_all_deals", {
                  total,
                  _: "All deals",
                })}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SNAPSHOT_STAGES.map((stage) => {
          const label = findDealLabel(dealStages, stage) ?? stage;
          const count = isPending ? "\u2014" : (counts[stage] ?? 0);
          const search = `filter=${encodeURIComponent(
            JSON.stringify({ stage }),
          )}`;
          return (
            <Link
              key={stage}
              to={{ pathname: "/deals", search }}
              className="rounded-xl border border-white/10 bg-[#0D1A2D]/80 px-4 py-3 hover:bg-[#162442]/80 transition-colors"
            >
              <p className="text-xs uppercase tracking-wider text-[#8B9DB8]">
                {label}
              </p>
              <p className="text-2xl font-semibold tabular-nums mt-1 text-white">
                {count}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
