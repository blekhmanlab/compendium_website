import tippy, { followCursor } from "tippy.js";
import type { Instance, Props } from "tippy.js";
import "tippy.js/dist/tippy.css";

/** tippy options */
const options: Partial<Props> = {
  delay: [50, 0],
  duration: [100, 100],
  offset: [15, 15],
  allowHTML: true,
  appendTo: document.body,
  plugins: [followCursor],
  hideOnClick: false,
  // onHide: () => false,
};

/** update all tooltips in document */
const updateAll = () =>
  document.querySelectorAll("[data-tooltip]").forEach(update);

/** update tippy instance */
const update = (element: Element & { _tippy?: Instance }) => {
  /** if element unmounted, remove */
  if (!element.isConnected) return element._tippy?.destroy();

  /** get tooltip content from attribute */
  const content = element.getAttribute("data-tooltip")?.trim() || "";

  /** don't show if content blank */
  if (!content) return element._tippy?.destroy();

  /** get existing tippy instance or create new */
  const instance = element._tippy ?? tippy(element, options);

  /** update tippy content */
  instance.setContent(content);

  /** force re-position after rendering updates */
  if (instance.popperInstance)
    window.setTimeout(instance.popperInstance.update, 20);
};

/** listen for changes to document */
new MutationObserver(updateAll).observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["data-tooltip"],
});
