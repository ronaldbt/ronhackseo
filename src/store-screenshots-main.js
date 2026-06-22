import { createApp } from 'vue'
import '../style.css'
import StoreScreenshotApp from './store-screenshots/StoreScreenshotApp.vue'

const params = new URLSearchParams(window.location.search)
const shot = params.get('shot') || 'resumen'

createApp(StoreScreenshotApp, { shot }).mount('#store-screenshots-app')
