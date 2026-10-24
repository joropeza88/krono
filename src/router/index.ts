import { createRouter, createWebHistory } from "@ionic/vue-router";
import RoutinesPage from "../pages/RoutinesPage.vue";
import RoutineSessionPage from "../pages/RoutineSessionPage.vue";
import TimerPage from "../pages/TimerPage.vue";
import TimerSessionPage from "../pages/TimerSessionPage.vue";
import ProgressPage from "../pages/ProgressPage.vue";

export const router = createRouter({
  history: createWebHistory("/"),
  routes: [
    { path: "/", redirect: "/rutinas" },
    { path: "/rutinas", name: "routines", component: RoutinesPage },
    { path: "/rutinas/sesion", name: "routine-session", component: RoutineSessionPage },
    { path: "/cronometro", name: "timer", component: TimerPage },
    { path: "/progreso", name: "progress", component: ProgressPage },
    { path: "/cronometro/activo", name: "timer-session", component: TimerSessionPage },
  ],
});
