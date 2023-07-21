/// <reference types="vite/client" />
/// <reference types="vite-plugin-comlink/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module "trigram-similarity" {
  const trigramSimilarity: (input1: string, input2: string) => number;
  export default trigramSimilarity;
}
