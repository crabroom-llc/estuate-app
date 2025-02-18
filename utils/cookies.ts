import nookies from 'nookies';

// Function to set a session ID in cookies
export function setCookie(ctx = null, key, value) {
    nookies.set(ctx, key, value, {
        maxAge: 1 * 24 * 60 * 60, // Cookie expiry (1 day)
        path: '/', // Cookie available on all pages
        secure: true, // Use this in production for HTTPS
        // httpOnly: true, // Prevent client-side JavaScript access
        sameSite: 'Strict' // Prevent cross-site request forgery
    });
    return value;
}

// Function to get the session ID from cookies
export function getCookie(ctx = null, key) {
    const cookies = nookies.get(ctx); // Retrieve cookies
    return cookies[key] || false; // Return session ID or null
}


