// Email verification script
document.addEventListener('DOMContentLoaded', function() {
    // Get token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    const statusDiv = document.getElementById('status');
    
    if (!token) {
        statusDiv.innerHTML = `
            <div class="error">❌ Invalid Verification Link</div>
            <div class="message">No verification token found in the URL.</div>
            <a href="/" class="btn">Go to Home</a>
        `;
        return;
    }

    // Show loading state
    statusDiv.innerHTML = `
        <div class="loading">🔄 Checking verification status...</div>
        <div class="message">Verification token: <div class="token-display">${token}</div></div>
    `;
    
    // Make API call to verify email
    console.log('Starting verification for token:', token);
    
    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: token }),
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId); // Clear timeout on successful response
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            return response.text().then(text => {
                console.error('Error response:', text);
                throw new Error(`HTTP error! status: ${response.status}, message: ${text}`);
            });
        }
        
        return response.json();
    })
    .then(data => {
        console.log('Verification response:', data);
        if (data.success) {
            // Check if this was already verified or newly verified
            if (data.message && data.message.includes('already verified')) {
                statusDiv.innerHTML = `
                    <div class="success">✅ Email Already Verified!</div>
                    <div class="message">
                        Your email address was already verified. You can now log in to your account.
                    </div>
                    <a href="/" class="btn btn-success">Continue to Login</a>
                `;
            } else {
                statusDiv.innerHTML = `
                    <div class="success">✅ Email Verified Successfully!</div>
                    <div class="message">
                        Your email address has been verified. You can now log in to your account.
                    </div>
                    <a href="/" class="btn btn-success">Continue to Login</a>
                `;
            }
        } else {
            statusDiv.innerHTML = `
                <div class="error">❌ Verification Failed</div>
                <div class="message">${data.message || 'Email verification failed. The token may be invalid or expired.'}</div>
                <a href="/" class="btn">Go to Home</a>
            `;
        }
    })
    .catch(error => {
        clearTimeout(timeoutId); // Clear timeout on error
        console.error('Verification error:', error);
        
        let errorMessage = 'There was an error verifying your email. Please try again later.';
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please check your internet connection and try again.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        statusDiv.innerHTML = `
            <div class="error">❌ Verification Error</div>
            <div class="message">${errorMessage}</div>
            <div class="message">Please check the browser console (F12) for more details.</div>
            <div class="message">You can also try refreshing the page.</div>
            <a href="/" class="btn">Go to Home</a>
            <a href="javascript:location.reload()" class="btn">Refresh Page</a>
        `;
    });
});

