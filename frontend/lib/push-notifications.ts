import { apiFetch } from './api';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

function isPushSupported() {
    return (
        'serviceWorker' in navigator &&
        'Notification' in window &&
        'PushManager' in window
    );
}

async function getPushRegistration() {
    if (!isPushSupported()) return null;

    const existingRegistration = await navigator.serviceWorker.getRegistration('/');
    if (existingRegistration) {
        return existingRegistration;
    }

    await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
    });
    return navigator.serviceWorker.ready;
}

async function syncSubscription(
    subscription: PushSubscription,
    statusType: 'subscribe' | 'unsubscribe',
) {
    await apiFetch('/webpush/save_information/', {
        method: 'POST',
        body: JSON.stringify({
            status_type: statusType,
            subscription: subscription.toJSON(),
            browser: navigator.userAgent,
        }),
    });
}

export async function getCurrentPushSubscription() {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration) return null;

    return registration.pushManager.getSubscription();
}

export async function syncBrowserPushSubscription() {
    if (!isPushSupported()) return false;

    try {
        const registration = await getPushRegistration();
        if (!registration) return false;

        const subscription = await registration.pushManager.getSubscription();
        if (!subscription) return false;

        await syncSubscription(subscription, 'subscribe');
        return true;
    } catch (error) {
        console.error('Push sync failed:', error);
        return false;
    }
}

export async function subscribeUserToPush() {
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

    if (!vapidPublicKey || !isPushSupported()) return false;

    try {
        if (Notification.permission === 'denied') {
            return false;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return false;

        const registration = await getPushRegistration();
        if (!registration) return false;

        const existingSubscription = await registration.pushManager.getSubscription();
        let subscription = existingSubscription;

        if (!subscription) {
            const applicationServerKey = urlBase64ToUint8Array(
                vapidPublicKey.trim().replace(/^['"]|['"]$/g, ''),
            );

            try {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey,
                });
            } catch (error) {
                console.error('Push subscribe failed:', error);
                return false;
            }
        }

        await syncSubscription(subscription, 'subscribe');
        return true;
    } catch (error) {
        console.error('Push registration failed:', error);
        return false;
    }
}

export async function unsubscribeUserFromPush() {
    if (!isPushSupported()) return false;

    try {
        const registration = await getPushRegistration();
        if (!registration) return false;

        const subscription = await registration.pushManager.getSubscription();
        if (!subscription) return true;

        await subscription.unsubscribe();
        await syncSubscription(subscription, 'unsubscribe');
        return true;
    } catch (error) {
        console.error('Push unregistration failed:', error);
        return false;
    }
}
