import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC3g85grffiBMjSWQ-1XMljIlEU6_bt_w8",
    authDomain: "chikane-e5fa1.firebaseapp.com",
    projectId: "chikane-e5fa1",
    storageBucket: "chikane-e5fa1.appspot.com",
    messagingSenderId: "989422231159",
    appId: "1:989422231159:web:2895f389094dcccb9d3072",
    measurementId: "G-GX4ZZW6EXK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// List of protected pages that require authentication
const protectedPages = [
    'dashboard.html',
    'create-event.html',
    'event-details.html'
];

// List of auth pages where logged-in users should be redirected away from
const authPages = [
    'login.html',
    'register.html'
];

// Get the current page name from the URL
const getCurrentPage = () => {
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);
    return page || 'index.html';
};

// Initialize auth state handling
export function initializeAuthHandler() {
    const currentPage = getCurrentPage();
    
    onAuthStateChanged(auth, (user) => {
        console.log('Auth state changed:', user ? 'logged in' : 'logged out');
        if (user) {
            // User is logged in
            if (authPages.includes(currentPage)) {
                // Redirect away from auth pages if logged in
                window.location.href = 'dashboard.html';
            }
        } else {
            // User is not logged in
            if (protectedPages.includes(currentPage)) {
                // Redirect to login if trying to access protected pages
                window.location.href = 'login.html';
            }
        }
    });
}

// Check if the current page requires auth
export function requireAuth() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            if (user) {
                console.log('User authenticated:', user.email);
                resolve(user);
            } else {
                console.log('User not authenticated');
                reject(new Error('Not authenticated'));
                window.location.href = 'login.html';
            }
        });
    });
}

// Check if user is logged in
export function isLoggedIn() {
    return auth.currentUser !== null;
}

// Get current user
export function getCurrentUser() {
    return auth.currentUser;
}

// Get current user email
export function getCurrentUserEmail() {
    return auth.currentUser?.email || 'Not logged in';
}

// Add logout function
export function logout() {
    return auth.signOut();
}