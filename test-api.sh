#!/bin/bash

# 🔐 SECURE SELECT API TEST SCRIPT (CURL VERSION)
# 
# This script demonstrates how to use the Secure SELECT API
# with JWT authentication using curl commands.
# 
# Usage:
# 1. Make sure your backend server is running on http://localhost:3000
# 2. Run: bash test-api.sh
# 3. Enter your login credentials when prompted

# Configuration
API_BASE_URL="http://localhost:3000"
AUTH_URL="${API_BASE_URL}/api/auth"
SECURE_SELECT_URL="${API_BASE_URL}/api/secure-select"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    
    case $status in
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "info")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "header")
            echo -e "${BLUE}🚀 $message${NC}"
            ;;
    esac
}

# Function to make authenticated request
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    if [ "$method" = "GET" ]; then
        if [ -n "$token" ]; then
            curl -s -X GET "${SECURE_SELECT_URL}${endpoint}" \
                -H "Authorization: Bearer $token" \
                -H "Content-Type: application/json"
        else
            curl -s -X GET "${SECURE_SELECT_URL}${endpoint}" \
                -H "Content-Type: application/json"
        fi
    elif [ "$method" = "POST" ]; then
        if [ -n "$token" ]; then
            curl -s -X POST "${SECURE_SELECT_URL}${endpoint}" \
                -H "Authorization: Bearer $token" \
                -H "Content-Type: application/json" \
                -d "$data"
        else
            curl -s -X POST "${SECURE_SELECT_URL}${endpoint}" \
                -H "Content-Type: application/json" \
                -d "$data"
        fi
    fi
}

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local token=$5
    
    echo ""
    print_status "info" "Testing: $name"
    
    local response
    if [ "$method" = "GET" ]; then
        response=$(make_request "GET" "$endpoint" "" "$token")
    else
        response=$(make_request "POST" "$endpoint" "$data" "$token")
    fi
    
    # Check if response contains success
    if echo "$response" | grep -q '"success":true'; then
        print_status "success" "$name - Success"
        
        # Extract and display relevant data
        case $name in
            "Allowed Tables")
                local tableCount=$(echo "$response" | grep -o '"tableCount":[0-9]*' | grep -o '[0-9]*')
                local role=$(echo "$response" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)
                echo "   📊 Role: $role"
                echo "   📋 Tables: $tableCount"
                ;;
            "Places Data")
                local count=$(echo "$response" | grep -o '"totalRecords":[0-9]*' | grep -o '[0-9]*')
                echo "   🏢 Found $count places"
                ;;
            "Visitors Data")
                local count=$(echo "$response" | grep -o '"totalRecords":[0-9]*' | grep -o '[0-9]*')
                echo "   👥 Found $count visitors"
                ;;
            "Visits Data")
                local count=$(echo "$response" | grep -o '"totalRecords":[0-9]*' | grep -o '[0-9]*')
                echo "   📅 Found $count visits"
                ;;
            "Advanced Search")
                local count=$(echo "$response" | grep -o '"totalRecords":[0-9]*' | grep -o '[0-9]*')
                echo "   🔍 Found $count results"
                ;;
            "Global Search")
                local totalResults=$(echo "$response" | grep -o '"totalResults":[0-9]*' | grep -o '[0-9]*')
                echo "   🌐 Total results: $totalResults"
                ;;
        esac
    else
        print_status "error" "$name - Failed"
        echo "   Response: $response" | head -c 200
        echo "..."
    fi
}

# Main function
main() {
    echo "🏢 Place Management System - Secure SELECT API Tester"
    echo "====================================================="
    echo "This script will test the Secure SELECT API with JWT authentication."
    echo ""
    
    # Get login credentials
    read -p "📧 Enter your email: " email
    read -s -p "🔐 Enter your password: " password
    echo ""
    
    echo ""
    echo "=================================================="
    
    # Login
    print_status "info" "Logging in..."
    
    local login_response
    login_response=$(curl -s -X POST "$AUTH_URL/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    if echo "$login_response" | grep -q '"success":true'; then
        print_status "success" "Login successful!"
        
        # Extract JWT token
        local jwt_token
        jwt_token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        
        # Extract user info
        local user_role
        user_role=$(echo "$login_response" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)
        
        echo "   👤 User: $email"
        echo "   🎭 Role: $user_role"
        echo "   🔑 Token: ${jwt_token:0:50}..."
        
        echo ""
        print_status "header" "Running Secure SELECT API Tests"
        echo "====================================="
        
        # Test all endpoints
        test_endpoint "Allowed Tables" "GET" "/tables" "" "$jwt_token"
        test_endpoint "Table Info" "GET" "/places/info" "" "$jwt_token"
        test_endpoint "Places Data" "GET" "/places?limit=3" "" "$jwt_token"
        test_endpoint "Visitors Data" "GET" "/visitors?limit=3" "" "$jwt_token"
        test_endpoint "Visits Data" "GET" "/visits?limit=3" "" "$jwt_token"
        test_endpoint "Today's Visits" "GET" "/todays_visits" "" "$jwt_token"
        test_endpoint "Filter Capabilities" "GET" "/capabilities" "" "$jwt_token"
        
        # Test filtering
        test_endpoint "Text Search Filter" "GET" "/visitors?filters=[{\"column\":\"first_name\",\"operator\":\"contains\",\"value\":\"John\"}]" "" "$jwt_token"
        
        # Test advanced search
        test_endpoint "Advanced Search" "POST" "/places/search" '{"filters":[{"column":"is_active","operator":"is_true","value":true}],"limit":5}' "$jwt_token"
        
        # Test global search
        test_endpoint "Global Search" "POST" "/search" '{"searchTerm":"office","searchColumns":["name","description"]}' "$jwt_token"
        
        echo ""
        print_status "success" "All tests completed!"
        
        # Show usage examples
        echo ""
        print_status "header" "Usage Examples"
        echo "=============="
        echo ""
        echo "🔑 Your JWT Token:"
        echo "   $jwt_token"
        echo ""
        echo "📝 Example curl commands:"
        echo "   # Get places"
        echo "   curl -H \"Authorization: Bearer $jwt_token\" \\"
        echo "        \"$SECURE_SELECT_URL/places\""
        echo ""
        echo "   # Search visitors by name"
        echo "   curl -H \"Authorization: Bearer $jwt_token\" \\"
        echo "        \"$SECURE_SELECT_URL/visitors?filters=[{\\\"column\\\":\\\"first_name\\\",\\\"operator\\\":\\\"contains\\\",\\\"value\\\":\\\"John\\\"}]\""
        echo ""
        echo "   # Advanced search (POST)"
        echo "   curl -X POST -H \"Authorization: Bearer $jwt_token\" \\"
        echo "        -H \"Content-Type: application/json\" \\"
        echo "        -d '{\"filters\":[{\"column\":\"city\",\"operator\":\"equals\",\"value\":\"New York\"}]}' \\"
        echo "        \"$SECURE_SELECT_URL/places/search\""
        
    else
        print_status "error" "Login failed!"
        echo "   Response: $login_response"
    fi
}

# Run the script
main "$@"
