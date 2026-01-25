// Email verification script
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const verificationToken = urlParams.get('token');
    const statusDiv = document.getElementById('status');

    // API endpoint
    const API_URL = '/api/auth/verify-email';
    // Frontend login page URL
    const LOGIN_URL = 'https://vms.cbiz365.com/login';

    if (!verificationToken) {
        statusDiv.innerHTML = `
            <div class="error">❌ Invalid Verification Link</div>
            <div class="message">No verification token found in the URL.</div>
        `;
        return;
    }

    // Auto-verify on load
    console.log('Verifying token:', verificationToken);

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                statusDiv.innerHTML = `
                <div class="success">✅ Email Verified Successfully!</div>
                <div class="message">${data.message || 'Your account is now active.'}</div>
                <a href="${LOGIN_URL}" class="btn">Go to Login</a>
            `;
            } else {
                // Handle specific case where already verified
                if (data.message && data.message.includes('already verified')) {
                    statusDiv.innerHTML = `
                    <div class="success">✅ Email Already Verified</div>
                    <div class="message">${data.message}</div>
                    <a href="${LOGIN_URL}" class="btn">Go to Login</a>
                `;
                } else {
                    statusDiv.innerHTML = `
                    <div class="error">❌ Verification Failed</div>
                    <div class="message">${data.message || 'Invalid or expired token.'}</div>
                `;
                }
            }
        })
        .catch(error => {
            console.error('Verification error:', error);
            statusDiv.innerHTML = `
            <div class="error">⚠️ Connection Error</div>
            <div class="message">Could not connect to the server. Please try again later.</div>
        `;
        });
});

