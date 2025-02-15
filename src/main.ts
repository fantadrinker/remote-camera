import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import './style.css';
import App from './App.vue';
import { createAuth0 } from '@auth0/auth0-vue';
import BroadcastVue from './components/Broadcast.vue';
import ViewerVue from './components/Viewer.vue';
import WelcomeVue from './components/Welcome.vue';


const BASE_URL = process.env.NODE_ENV === 'production'
  ? `${window.location.origin}/remote-camera`
  : window.location.origin;


const routes = [
  { path: '/', component: WelcomeVue },
  { path: '/broadcast', component: BroadcastVue },
  // TODO: implement view for individual camera, and recordings
  { path: '/camera', component: ViewerVue },
];

const app = createApp(App);

app.use(
  createRouter({
    history: createWebHistory(BASE_URL),
    routes,
  })
);

app.use(
  createAuth0({
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_APP_CLIENT_ID,
    authorizationParams: {
      redirect_uri: BASE_URL,
      audience: import.meta.env.VITE_AWS_API_ENDPOINT,
    },
    cacheLocation: 'localstorage',
  })
);

app.mount('#app');
