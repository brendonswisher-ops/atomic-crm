import * as React from "react";
import { useCallback } from "react";
import { Mail } from "lucide-react";
import {
  fetchRelatedRecords,
  useDataProvider,
  useNotify,
  useListContext,
} from "ra-core";
import { Button } from "@/components/ui/button";

import { outlookExporter } from "./exportOutlook";

export const ExportOutlookButton = ({
  maxResults = 10000,
}: {
  maxResults?: number;
}) => {
  const { getData, total, resource } = useListContext();
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (!getData) {
        throw new Error(
          "ListContext.getData must be defined to use ExportOutlookButton.",
        );
      }

      getData({ maxResults })
        .then(
          (data) =>
            outlookExporter(
              data,
              fetchRelatedRecords(dataProvider),
              dataProvider,
              resource,
            ),
        )
        .catch((error) => {
          console.error(error);
          notify("HTTP Error", { type: "error" });
        });
    },
    [dataProvider, getData, notify, resource, maxResults],
  );

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={total === 0}
      className="cursor-pointer"
    >
      <Mail />
      Export to Outlook
    </Button>
  );
};
