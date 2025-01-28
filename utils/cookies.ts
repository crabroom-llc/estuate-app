import nookies from 'nookies';

// Function to set a session ID in cookies
export function settoken(ctx = null, token) {
    nookies.set(ctx, 'token', token, {
        maxAge: 1 * 24 * 60 * 60, // Cookie expiry (1 day)
        path: '/', // Cookie available on all pages
        secure: true, // Use this in production for HTTPS
        // httpOnly: true, // Prevent client-side JavaScript access
        sameSite: 'Strict' // Prevent cross-site request forgery
    });
    return token;
}

// Function to get the session ID from cookies
export function gettoken(ctx = null) {
    const cookies = nookies.get(ctx); // Retrieve cookies
    return cookies['token'] || false; // Return session ID or null
}
