import type { ReactNode } from "react";

/** https://github.com/sindresorhus/type-fest/issues/942 */
export type KeysOfType<Obj, Type> = {
  [Key in keyof Obj]-?: Key extends Type ? Key : never;
}[keyof Obj];

export type SyncFunctionComponent = <Props = object>(props: Props) => ReactNode;
