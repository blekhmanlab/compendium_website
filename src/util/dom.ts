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
