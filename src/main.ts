import { createApp } from "vue";
import { IonicVue } from "@ionic/vue";
import AppShell from "./AppShell.vue";
import { router } from "./router";
import { pwaUpdateService } from "./services/pwaUpdate";
import "./styles.css";
import "@ionic/vue/css/core.css";
import "@ionic/vue/css/normalize.css";
import "@ionic/vue/css/structure.css";
import "@ionic/vue/css/typography.css";

createApp(AppShell).use(IonicVue, { mode: "ios" }).use(router).mount("#app");

window.addEventListener("load", () => void pwaUpdateService.start());
