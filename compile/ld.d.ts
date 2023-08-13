/** types for json-ld from zenodo */
/** view-source:https://doi.org/10.5281/zenodo.8186993 */
/** https://jvilk.com/MakeTypes/ */

export type LD = {
  "@context": string;
  "@id": string;
  "@type": string;
  creator: Creator[];
  datePublished: string;
  description: string;
  distribution: Distribution[];
  identifier: string;
  inLanguage: InLanguage;
  license: string;
  name: string;
  url: string;
  version: string;
};

export type Creator = {
  "@id": string;
  "@type": string;
  affiliation: string;
  name: string;
};

export type Distribution = {
  "@type": string;
  contentUrl: string;
  encodingFormat: string;
};

export type InLanguage = {
  "@type": string;
  alternateName: string;
  name: string;
};
