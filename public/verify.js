// Email verification script
let verificationToken = null;

// Get token from URL parameters on page load
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    verificationToken = urlParams.get('token');
    
    const statusDiv = document.getElementById('status');
    const verifyBtn = document.getElementById('verifyBtn');
    
    if (!verificationToken) {
        statusDiv.innerHTML = `
            <div class="error">❌ Invalid Verification Link</div>
            <div class="message">No verification token found in the URL.</div>
            <a href="/" class="btn">Go to Home</a>
        `;
        return;
    }
    
    // Token exists, show verify button (already shown in HTML)
    console.log('Verification token loaded:', verificationToken);
});

// Function to verify email when button is clicked
function verifyEmail() {
    const statusDiv = document.getElementById('status');
    const verifyBtn = document.getElementById('verifyBtn');
    const resultDiv = document.getElementById('result');
    
    if (!verificationToken) {
        resultDiv.innerHTML = `
            <div class="error">❌ No verification token found</div>
        `;
        resultDiv.style.display = 'block';
        return;
    }
    
    // Disable button and show loading
    verifyBtn.disabled = true;
    verifyBtn.textContent = '🔄 Verifying...';
    resultDiv.innerHTML = `
        <div class="loading">🔄 Verifying your email address...</div>
    `;
    resultDiv.style.display = 'block';
    
    // Make API call to verify email
    console.log('Starting verification for token:', verificationToken);
    
    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: verificationToken }),
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        console.log('Response status:', response.status);
        
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
        
        // Hide verify button
        verifyBtn.style.display = 'none';
        
        if (data.success) {
            // Get frontend URL (default to https://people.cbiz365.com)
            const frontendUrl = data.data?.redirectUrl || 'https://people.cbiz365.com';
            
            // Check if this was already verified or newly verified
            if (data.message && data.message.includes('already verified')) {
                resultDiv.innerHTML = `
                    <div class="success">✅ Email Already Verified!</div>
                    <div class="message">
                        Your email address was already verified. You can now log in to your account.
                    </div>
                    <a href="${frontendUrl}" class="btn btn-success">Continue to Login</a>
                `;
            } else {
                resultDiv.innerHTML = `
                    <div class="success">✅ Email Verified Successfully!</div>
                    <div class="message">
                        Your email address has been verified. You can now log in to your account.
                    </div>
                    <a href="${frontendUrl}" class="btn btn-success">Continue to Login</a>
                `;
            }
        } else {
            resultDiv.innerHTML = `
                <div class="error">❌ Verification Failed</div>
                <div class="message">${data.message || 'Email verification failed. The token may be invalid or expired.'}</div>
                <a href="/" class="btn">Go to Home</a>
            `;
            // Re-enable button for retry
            verifyBtn.disabled = false;
            verifyBtn.textContent = '✅ Verify Email Address';
            verifyBtn.style.display = 'inline-block';
        }
    })
    .catch(error => {
        clearTimeout(timeoutId);
        console.error('Verification error:', error);
        
        let errorMessage = 'There was an error verifying your email. Please try again later.';
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please check your internet connection and try again.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        resultDiv.innerHTML = `
            <div class="error">❌ Verification Error</div>
            <div class="message">${errorMessage}</div>
            <a href="javascript:location.reload()" class="btn">Try Again</a>
        `;
        
        // Re-enable button for retry
        verifyBtn.disabled = false;
        verifyBtn.textContent = '✅ Verify Email Address';
        verifyBtn.style.display = 'inline-block';
    });
}

