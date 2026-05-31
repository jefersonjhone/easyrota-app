import { apiFetch } from './api';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export async function subscribeUserToPush() {
    const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    
    if (!VAPID_PUBLIC_KEY) return;

    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Verifica se já existe uma inscrição para evitar erros de serviço
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                return; 
            }

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            await apiFetch('/webpush/save_information/', {
                method: 'POST',
                body: JSON.stringify({
                    status_type: 'subscribe',
                    subscription: subscription.toJSON(),
                    browser: navigator.userAgent
                })
            });
            console.log("Push notification subscription successful.");
        } catch (error) {
            // Se o erro for AbortError, geralmente é rede ou bloqueio do browser
            console.error("Push registration failed:", error);
        }
    }
}
