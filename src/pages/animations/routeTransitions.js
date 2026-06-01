export const mainRouteTransitions = {
  link: "main-link",
  scroll: "main-scroll",
};

export function isMainRouteTransition(transition) {
  return typeof transition === "string" && transition.startsWith("main-");
}
