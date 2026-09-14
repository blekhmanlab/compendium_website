import { useState } from "react";
import { isEqual } from "lodash";

/** check if value changed from previous render */
export const useChanged = <Value>(value: Value) => {
  const [prev, setPrev] = useState<Value>();
  const changed = !isEqual(prev, value);
  if (changed) setPrev(value);
  return changed;
};
