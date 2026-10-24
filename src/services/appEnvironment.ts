import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const TABLET_MAX_WIDTH = 1024;
const standaloneQuery = "(display-mode: standalone)";

function isInstalledApp() {
  const standaloneMode = window.matchMedia(standaloneQuery).matches;
  const iosStandalone =
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  return standaloneMode || iosStandalone;
}

function isMobileOrTablet() {
  const compactViewport = window.matchMedia(`(max-width: ${TABLET_MAX_WIDTH}px)`).matches;
  const touchTablet = navigator.maxTouchPoints > 0 && Math.max(screen.width, screen.height) <= 1366;

  return compactViewport || touchTablet;
}

export function useAppEnvironment() {
  const installed = ref(false);
  const mobileOrTablet = ref(false);

  function update() {
    installed.value = true; //isInstalledApp();
    mobileOrTablet.value = true; //isMobileOrTablet();
  }

  onMounted(() => {
    update();
    window.addEventListener("resize", update);
    window.matchMedia(standaloneQuery).addEventListener("change", update);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("resize", update);
    window.matchMedia(standaloneQuery).removeEventListener("change", update);
  });

  return {
    installed,
    mobileOrTablet,
    shouldShowApp: computed(() => installed.value && mobileOrTablet.value),
  };
}
