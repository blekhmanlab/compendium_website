import { sleep } from "@/util/async";

/**
 * get transform matrix that converts point from one element coordinate system
 * to another
 */
export const getMatrix = (to: SVGGraphicsElement, from: SVGGraphicsElement) =>
  (to.getScreenCTM() || new SVGMatrix())
    .inverse()
    .multiply(from.getScreenCTM() || new SVGMatrix());

/** get css variable */
export const getCssVariable = (name: string) =>
  getComputedStyle(document.body).getPropertyValue(name);

/** download element as svg */
export const downloadSvg = (
  element: Element,
  filename = "chart",
  addAttrs: { [key: string]: string } = { style: "font-family: sans-serif;" },
  removeAttrs: RegExp[] = [/^data-.*/, /^aria-.*/],
) => {
  if (!element) return;

  /** make clone of node to work with and mutate */
  const clone = element.cloneNode(true) as Element;

  /** always ensure xmlns so svg is valid outside of html */
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  /** set other custom attributes on top level svg element */
  for (const [key, value] of Object.entries(addAttrs))
    clone.setAttribute(key, value);

  /** remove specific attributes from all elements */
  for (const element of clone.querySelectorAll("*"))
    for (const removeAttr of removeAttrs)
      for (const { name } of [...element.attributes])
        if (name.match(removeAttr)) element.removeAttribute(name);

  /** download clone as svg file */
  const data = clone.outerHTML;
  const blob = new Blob([data], { type: "image/svg+xml" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename + ".svg";
  link.click();
  window.URL.revokeObjectURL(url);
};

/**
 * scroll page so that mouse stays at same position in document relative to
 * element
 */
export const preserveScroll = async (element: Element) => {
  const oldY = element.getBoundingClientRect().top;
  await sleep(0);
  const newY = element.getBoundingClientRect().top;
  window.scrollBy({ top: newY - oldY, behavior: "instant" });
};
