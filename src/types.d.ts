/** https://github.com/pd4d10/vite-plugin-svgr/issues/128 */
declare module "*.svg?react" {
  import type { ComponentProps } from "react";
  import type { SyncFunctionComponent } from "@/util/types";

  const ReactComponent: SyncFunctionComponent<
    ComponentProps<"svg"> & {
      title?: string;
      titleId?: string;
      desc?: string;
      descId?: string;
    }
  >;

  export default ReactComponent;
}

/** library doesn't provide type defs */
declare module "trigram-similarity" {
  const trigramSimilarity: (input1: string, input2: string) => number;
  export default trigramSimilarity;
}
