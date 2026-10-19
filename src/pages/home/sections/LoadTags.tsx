import type { ReactNode } from "react";
import { isEmpty } from "lodash";
import { FileExclamationPointIcon } from "lucide-react";
import Alert from "@/components/Alert";
import Button from "@/components/Button";
import Tooltip from "@/components/Tooltip";
import { setTagsEnabled, useData } from "@/pages/home/state";

type Props = {
  children: ReactNode;
};

export default function LoadTags({ children }: Props) {
  const tagValues = useData((state) => state.tagValues);
  const tagsEnabled = useData((state) => state.tagsEnabled);

  if (!tagsEnabled)
    return (
      <Tooltip
        content={
          <>
            <FileExclamationPointIcon />
            Loads up to ~100 MB of data. Beware if you're on metered internet!
          </>
        }
      >
        <Button onClick={() => setTagsEnabled(true)}>Load Tags</Button>
      </Tooltip>
    );

  if (isEmpty(tagValues)) return <Alert type="loading">Loading tags</Alert>;

  return children;
}
