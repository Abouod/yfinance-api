import { createRouter, createWebHistory } from "vue-router";
import SigninView from "../views/SigninView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: SigninView,
    },
  ],
});

export default router;
