/**
 * Secure Signup API - Frontend Utility Class
 * Easy-to-use JavaScript class for integrating secure signup API
 * 
 * Usage:
 *   const signupAPI = new SecureSignupAPI({
 *     baseURL: 'http://localhost:3000',
 *     appId: 'your_app_id',
 *     serviceKey: 'your_service_key'
 *   });
 * 
 *   const result = await signupAPI.signup({
 *     email: 'user@connexit.biz',
 *     password: 'SecurePass123!@#',
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     secretCode: 'CONNEX2024'
 *   });
 */

class SecureSignupAPI {
    constructor(config = {}) {
        this.baseURL = config.baseURL || 'http://localhost:3000';
        this.appId = config.appId || 'default_app_id';
        this.serviceKey = config.serviceKey || 'default_service_key';
        this.allowedDomains = [
            'connexit.biz',
            'connexcodeworks.biz',
            'conex360.biz',
            'connexvectra.biz'
        ];
    }

    /**
     * Validate email domain
     */
    validateEmailDomain(email) {
        if (!email) return { valid: false, message: 'Email is required' };
        
        const domain = email.split('@')[1]?.toLowerCase();
        if (!this.allowedDomains.includes(domain)) {
            return {
                valid: false,
                message: `Email must be from one of the allowed domains: ${this.allowedDomains.join(', ')}`
            };
        }
        return { valid: true };
    }

    /**
     * Validate password strength
     */
    validatePassword(password) {
        if (!password) {
            return { valid: false, message: 'Password is required' };
        }

        if (password.length < 12) {
            return { valid: false, message: 'Password must be at least 12 characters long' };
        }

        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/]/.test(password);

        if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
            return {
                valid: false,
                message: 'Password must contain uppercase, lowercase, number, and special character'
            };
        }

        return { valid: true };
    }

    /**
     * Validate name
     */
    validateName(name, fieldName = 'Name') {
        if (!name || !name.trim()) {
            return { valid: false, message: `${fieldName} is required` };
        }

        const trimmed = name.trim();
        if (trimmed.length < 2 || trimmed.length > 50) {
            return { valid: false, message: `${fieldName} must be between 2 and 50 characters` };
        }

        if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
            return { valid: false, message: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
        }

        return { valid: true };
    }

    /**
     * Validate secret code
     */
    validateSecretCode(secretCode) {
        if (!secretCode || !secretCode.trim()) {
            return { valid: false, message: 'Secret code is required' };
        }

        const trimmed = secretCode.trim();
        if (trimmed.length < 5 || trimmed.length > 100) {
            return { valid: false, message: 'Secret code must be between 5 and 100 characters' };
        }

        return { valid: true };
    }

    /**
     * Validate entire form
     */
    validateForm(formData) {
        const errors = {};

        // Email validation
        const emailValidation = this.validateEmailDomain(formData.email);
        if (!emailValidation.valid) {
            errors.email = emailValidation.message;
        }

        // Password validation
        const passwordValidation = this.validatePassword(formData.password);
        if (!passwordValidation.valid) {
            errors.password = passwordValidation.message;
        }

        // First name validation
        const firstNameValidation = this.validateName(formData.firstName, 'First name');
        if (!firstNameValidation.valid) {
            errors.firstName = firstNameValidation.message;
        }

        // Last name validation
        const lastNameValidation = this.validateName(formData.lastName, 'Last name');
        if (!lastNameValidation.valid) {
            errors.lastName = lastNameValidation.message;
        }

        // Secret code validation
        const secretCodeValidation = this.validateSecretCode(formData.secretCode);
        if (!secretCodeValidation.valid) {
            errors.secretCode = secretCodeValidation.message;
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    }

    /**
     * Sanitize form data
     */
    sanitizeFormData(formData) {
        return {
            email: formData.email.trim().toLowerCase(),
            password: formData.password, // Don't trim password
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            secretCode: formData.secretCode.trim().toUpperCase(),
            role: formData.role || 'user'
        };
    }

    /**
     * Signup method
     */
    async signup(formData) {
        try {
            // Sanitize data
            const sanitizedData = this.sanitizeFormData(formData);

            // Make API call
            const response = await fetch(`${this.baseURL}/api/auth/secure-signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-App-ID': this.appId,
                    'X-Service-Key': this.serviceKey
                },
                body: JSON.stringify(sanitizedData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                return {
                    success: true,
                    data: data.data,
                    message: data.message
                };
            } else {
                // Handle errors
                const errors = {};
                if (data.errors && Array.isArray(data.errors)) {
                    data.errors.forEach(err => {
                        const field = err.field || err.param;
                        errors[field] = err.message || err.msg;
                    });
                }

                return {
                    success: false,
                    message: data.message || 'Signup failed',
                    errors: errors,
                    status: response.status
                };
            }
        } catch (error) {
            console.error('Signup API error:', error);
            return {
                success: false,
                message: 'Network error. Please try again.',
                error: error.message
            };
        }
    }

    /**
     * Check password strength (for UI feedback)
     */
    checkPasswordStrength(password) {
        if (!password) {
            return { strength: 0, checks: {}, isValid: false };
        }

        const checks = {
            length: password.length >= 12,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/]/.test(password)
        };

        const strength = Object.values(checks).filter(Boolean).length;
        const isValid = strength === 5;

        return { strength, checks, isValid };
    }

    /**
     * Get allowed email domains
     */
    getAllowedDomains() {
        return [...this.allowedDomains];
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureSignupAPI;
}

// Export for ES6 modules
if (typeof window !== 'undefined') {
    window.SecureSignupAPI = SecureSignupAPI;
}

