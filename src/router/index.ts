import { createRouter, createWebHistory } from "@ionic/vue-router";
import RoutinesPage from "../pages/RoutinesPage.vue";
import RoutineSessionPage from "../pages/RoutineSessionPage.vue";
import TimerPage from "../pages/TimerPage.vue";
import TimerSessionPage from "../pages/TimerSessionPage.vue";

export const router = createRouter({
  history: createWebHistory("/"),
  routes: [
    { path: "/", redirect: "/rutinas" },
    { path: "/rutinas", name: "routines", component: RoutinesPage },
    { path: "/rutinas/sesion", name: "routine-session", component: RoutineSessionPage },
    { path: "/cronometro", name: "timer", component: TimerPage },
    { path: "/cronometro/activo", name: "timer-session", component: TimerSessionPage },
  ],
});
