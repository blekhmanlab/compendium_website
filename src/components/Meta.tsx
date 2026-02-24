import { truncate } from "lodash";

type Props = {
  /**
   * tab and page title. can be multiple parts (which get separated by
   * delimiter).
   */
  title: string | string[];
  /** page description */
  description?: string;
};

/** get site-wide meta */
const { VITE_TITLE, VITE_DESCRIPTION } = import.meta.env;
const site = { title: VITE_TITLE, description: VITE_DESCRIPTION };

/**
 * set specific metadata for current page (overrides site-wide metadata in.env),
 * akin to react-helmet
 */
export default function Meta(page: Props) {
  /** concat title string from parts */
  const title = [page.title]
    .flat()
    .concat(site.title)
    .map((part) => truncate(part.trim(), { length: 40, separator: " " }))
    .filter(Boolean)
    .join(" | ");

  /** get page-specific, or fall back to site-wide */
  const description = (page.description || site.description).trim();

  return (
    <>
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta property="og:title" content={title} />
      <meta name="description" content={description} />
      <meta property="og:description" content={description} />
    </>
  );
}
