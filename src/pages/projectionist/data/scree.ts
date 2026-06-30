import scree from "@/pages/projectionist/data/scree.json";

export type Scree = Record<
  string,
  { explained: Record<string, number>; cumulative: Record<string, number> }
>;

export const getScree = () => scree;
