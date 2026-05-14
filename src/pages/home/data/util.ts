import { orderBy } from "lodash";

/** filter/sort/etc search list */
export const cleanSearch = <Entry extends { name: string; samples: number }>(
  list: Entry[],
) =>
  /** sort */
  orderBy(list, ["samples", "name"], ["desc", "asc"]).filter(({ name }) =>
    name.trim(),
  );
