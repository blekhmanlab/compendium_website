declare module "geojson-dissolve" {
  import { Feature, Geometry } from "geojson";
  const dissolve: (arg: Feature[]) => Geometry;
  export default dissolve;
}
