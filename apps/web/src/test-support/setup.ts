import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();

// Headless UI waits for transition animations before removing popup content.
// Happy DOM does not implement this browser API, so tests provide the settled state.
if (!Element.prototype.getAnimations) {
  Element.prototype.getAnimations = () => [];
}
