type Props = {
  /** tab and page title */
  title: string;
  /** page description */
  description?: string;
};

/** set specific metadata for current page, akin to react-helmet */
export default function Meta({ title, description }: Props) {
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
