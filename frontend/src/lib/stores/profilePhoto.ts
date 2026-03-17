import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const STORAGE_KEY = 'profile_photo_base64';

const initial = browser ? localStorage.getItem(STORAGE_KEY) : null;

export const profilePhoto = writable<string | null>(initial);

if (browser) {
    profilePhoto.subscribe((value) => {
        if (value) {
            localStorage.setItem(STORAGE_KEY, value);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    });
}
