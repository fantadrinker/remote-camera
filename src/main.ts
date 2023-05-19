import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { createAuth0 } from '@auth0/auth0-vue';

const app = createApp(App);

app.use(
  createAuth0({
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_APP_CLIENT_ID,
    authorizationParams: {
      redirect_uri: process.env.NODE_ENV === 'production' ? `${window.location.origin}/finance-app` : window.location.origin,
      audience: import.meta.env.VITE_AWS_API_ENDPOINT,
    },
    cacheLocation: 'localstorage',
  })
);

app.mount('#app');

