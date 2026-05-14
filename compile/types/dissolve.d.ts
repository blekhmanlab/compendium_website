declare module "geojson-dissolve" {
  import type { Feature, Geometry } from "geojson";
  const dissolve: (arg: Feature[]) => Geometry;
  export default dissolve;
}
