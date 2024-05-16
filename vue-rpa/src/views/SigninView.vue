<template>
  <div id="body">
    <div :class="['container', { active: isActive }]">
      <div class="form-container sign-up">
        <form @submit.prevent="signUp">
          <h1 class="mb-3">Create Account</h1>
          <input
            v-model="signUpName"
            class="form-control my-1"
            type="text"
            placeholder="Name"
            aria-label="default input example"
          />
          <input
            v-model="signUpEmail"
            type="email"
            class="form-control my-1"
            placeholder="email@example.com"
          />
          <input
            v-model="signUpPassword"
            type="password"
            class="form-control my-1"
            aria-describedby="passwordHelpInline"
            placeholder="Password"
          />
          <button
            class="btn btn-primary custom-btn custom-toggle-btn"
            type="submit"
          >
            Sign Up
          </button>
        </form>
      </div>
      <div class="form-container sign-in">
        <form @submit.prevent="signIn">
          <h1 class="mb-3">Sign In</h1>
          <input
            v-model="signInEmail"
            type="email"
            class="form-control my-1"
            placeholder="email@example.com"
          />
          <input
            v-model="signInPassword"
            type="password"
            class="form-control my-1"
            aria-describedby="passwordHelpInline"
            placeholder="Password"
          />
          <a class="my-2" href="#">Forget Your Password?</a>
          <button
            class="my-2 btn btn-primary custom-btn custom-toggle-btn"
            type="submit"
          >
            Sign In
          </button>
        </form>
      </div>
      <div class="toggle-container">
        <div class="toggle">
          <div class="toggle-panel toggle-left">
            <img
              id="logo"
              src="@/assets/images/sophic_white.png"
              alt="Example Image"
            />
            <p>Enter your personal details to use all of site features</p>
            <button
              @click="toggleActive(false)"
              class="btn btn-outline-light btn-lg custom-toggle-btn"
            >
              Sign In
            </button>
          </div>
          <div class="toggle-panel toggle-right">
            <img
              id="logo"
              src="@/assets/images/sophic_white.png"
              alt="Example Image"
            />
            <p>
              Register with your personal details to use all of site features
            </p>
            <button
              @click="toggleActive(true)"
              class="btn btn-outline-light btn-lg custom-toggle-btn"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";

const isActive = ref(false);

const toggleActive = (active) => {
  isActive.value = active;
};

// Sign In Form
const signInEmail = ref("");
const signInPassword = ref("");

const signIn = async () => {
  try {
    const response = await axios.post("http://localhost:5163/api/users/login", {
      email: signInEmail.value,
      password: signInPassword.value,
    });
    console.log("Sign in successful:", response.data);
    // Handle successful sign-in
  } catch (error) {
    console.error("Error signing in:", error);
    // Handle sign-in error
  }

  // Sign Up Form
  const signUpName = ref("");
  const signUpEmail = ref("");
  const signUpPassword = ref("");

  const signUp = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5163/api/users/register",
        {
          name: signUpName.value,
          email: signUpEmail.value,
          password: signUpPassword.value,
        }
      );
      console.log("Sign up successful:", response.data);
      // Handle successful sign-up
    } catch (error) {
      console.error("Error signing up:", error);
      // Handle sign-up error
    }
  };
};
</script>

<style lang="scss" scoped>
$primary: #112d4e;
@import "@/scss/main.scss";

#body {
  background-color: #fff;
  background: linear-gradient(to right, #fff, #c9dfff);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100vh;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Montserrat", sans-serif;
}

#logo {
  max-width: 70%;
  height: auto;
  user-select: none;
}

.container {
  background-color: #fff;
  border-radius: 30px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.35);
  position: relative;
  overflow: hidden;
  width: 768px;
  max-width: 100%;
  min-height: 480px;
}

.container p {
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.3px;
  margin: 20px 0;
}

.container span {
  font-size: 12px;
}

.container a {
  color: #333;
  font-size: 13px;
  text-decoration: none;
  margin: 15px 0 10px;
}

.custom-toggle-btn {
  padding: 10px 45px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 10px;
}

.container form {
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 0 40px;
  height: 100%;
}

.container input {
  margin: 8px 0;
  padding: 10px 15px;
  font-size: 14px;
  border-radius: 8px;
  width: 100%;
  outline: none;
}

.form-container {
  position: absolute;
  top: 0;
  height: 100%;
  transition: all 0.6s ease-in-out;
}

.sign-in {
  left: 0;
  width: 50%;
  z-index: 2;
}

.container.active .sign-in {
  transform: translateX(100%);
}

.sign-up {
  left: 0;
  width: 50%;
  opacity: 0;
  z-index: 1;
}

.container.active .sign-up {
  transform: translateX(100%);
  opacity: 1;
  z-index: 5;
  animation: move 0.6s;
}

@keyframes move {
  0%,
  49.99% {
    opacity: 0;
    z-index: 1;
  }
  50%,
  100% {
    opacity: 1;
    z-index: 5;
  }
}

.toggle-container {
  position: absolute;
  top: 0;
  left: 50%;
  width: 50%;
  height: 100%;
  overflow: hidden;
  transition: all 0.6s ease-in-out;
  border-radius: 150px 0 0 100px;
  z-index: 1000;
}

.container.active .toggle-container {
  transform: translateX(-100%);
  border-radius: 0 150px 100px 0;
}

.toggle {
  background-color: var(--navyBlue);
  height: 100%;
  background: linear-gradient(to right, var(--darkBlue), var(--navyBlue));
  color: #fff;
  position: relative;
  left: -100%;
  height: 100%;
  width: 200%;
  transform: translateX(0);
  transition: all 0.6s ease-in-out;
}

.container.active .toggle {
  transform: translateX(50%);
}

.toggle-panel {
  position: absolute;
  width: 50%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 0 30px;
  text-align: center;
  top: 0;
  transform: translateX(0);
  transition: all 0.6s ease-in-out;
}

.toggle-left {
  transform: translateX(-200%);
}

.container.active .toggle-left {
  transform: translateX(0);
}

.toggle-right {
  right: 0;
  transform: translateX(0);
}

.container.active .toggle-right {
  transform: translateX(200%);
}
</style>
