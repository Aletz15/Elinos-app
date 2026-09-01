import { createRouter, createWebHistory } from 'vue-router'
import CatalogView from '../components/CatalogView.vue'
import OrderPanel from '../components/OrderPanel.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'catalogo', component: CatalogView },
    { path: '/panel', name: 'panel', component: OrderPanel },
  ],
})

export default router
