import { createRouter, createWebHistory } from "vue-router";
import SigninView from "../views/SigninView.vue";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Sign in",
      component: SigninView,
    },
    {
      path: "/home",
      name: "Home",
      component: HomeView,
    },
  ],
});

export default router;
