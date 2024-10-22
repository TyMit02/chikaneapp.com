// auth-handler.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";

const auth = getAuth();

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
                resolve(user);
            } else {
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