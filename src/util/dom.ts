import { formatHex } from "culori";
import { frame } from "@/util/async";

export type Theme = Record<`--${string}`, string>;

/** https://stackoverflow.com/a/78994961/2180570 */
/** get all css variables on root */
export const getTheme = (styles = getStyles()): Theme =>
  Object.fromEntries(
    Array.from(document.styleSheets)
      .flatMap((sheet) => {
        try {
          return Array.from(sheet.cssRules);
        } catch (error) {
          return [];
        }
      })
      .filter((rule) => rule instanceof CSSLayerBlockRule)
      .filter((rule) => rule.name === "theme")
      .flatMap((rule) => Array.from(rule.cssRules))
      .filter((rule) => rule instanceof CSSStyleRule)
      .flatMap((rule) => Array.from(rule.style))
      .filter((style) => style.startsWith("--"))
      .map((variable) => {
        let value = styles.getPropertyValue(variable);
        value = formatHex(value) ?? value;
        return [variable, value];
      }),
  );

/** get styles on target element */
export const getStyles = (target?: Element | null) =>
  window.getComputedStyle(target || document.documentElement);

/**
 * get transform matrix that converts point from one element coordinate system
 * to another
 */
export const getMatrix = (to: SVGGraphicsElement, from: SVGGraphicsElement) =>
  (to.getScreenCTM() || new SVGMatrix())
    .inverse()
    .multiply(from.getScreenCTM() || new SVGMatrix());

/** download element as svg */
export const downloadSvg = (
  element: Element,
  filename = "chart",
  addAttrs: Record<string, string> = { style: "font-family: sans-serif;" },
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
export const preserveScroll = async (element?: Element | null) => {
  if (!element) return;
  const oldY = element.getBoundingClientRect().top;
  await frame();
  const newY = element.getBoundingClientRect().top;
  if (!element.isConnected) return;
  window.scrollBy({ top: newY - oldY });
};

/** fit svg view box to contents */
export const fitViewBox = (svg: SVGSVGElement, padding = 0) => {
  /** get bbox of content in svg */
  let { x, y, width, height } = svg.getBBox();

  /** incorporate padding */
  x -= padding;
  y -= padding;
  width += padding * 2;
  height += padding * 2;

  /** set view box to bbox, essentially fitting view to content */
  const viewBox = [x, y, width, height].join(" ");

  svg.setAttribute("viewBox", viewBox);
};

/** shrink width to wrapped text https://stackoverflow.com/questions/14596213 */
export const shrinkWrap = (
  element: HTMLElement | null,
  startChild = 0,
  endChild = -1,
) => {
  if (!element) return;
  const start = [...element.childNodes].at(startChild);
  const end = [...element.childNodes].at(endChild);
  if (!start || !end) return;
  const range = document.createRange();
  range.setStartBefore(start);
  range.setEndAfter(end);
  const style = window.getComputedStyle(element);
  const paddingLeft = parseFloat(style.paddingLeft) || 0;
  const paddingRight = parseFloat(style.paddingRight) || 0;
  const { width } = range.getBoundingClientRect();
  element.style.maxWidth = width + paddingLeft + paddingRight + "px";
};
