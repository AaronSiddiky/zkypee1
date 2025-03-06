#!/bin/bash

# Configuration - modify these values as needed
BASE_URL="http://localhost:3000"
PHONE_NUMBER="+12025550123"
PAGE="1"
LIMIT="10"

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print section headers
print_header() {
  echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Make a request and pretty-print the JSON response
make_request() {
  local url="$1"
  local method="$2"
  local data="$3"
  local description="$4"
  
  echo -e "${YELLOW}Testing:${NC} $description"
  echo -e "${YELLOW}URL:${NC} $url"
  echo -e "${YELLOW}Method:${NC} $method"
  
  if [ -n "$data" ]; then
    echo -e "${YELLOW}Data:${NC} $data"
    response=$(curl -s -X "$method" -H "Content-Type: application/json" -d "$data" "$url")
  else
    response=$(curl -s -X "$method" -H "Content-Type: application/json" "$url")
  fi
  
  # Check if response is valid JSON
  if echo "$response" | jq . >/dev/null 2>&1; then
    echo -e "${GREEN}Response:${NC}"
    echo "$response" | jq .
  else
    echo -e "${RED}Error: Invalid JSON response${NC}"
    echo "$response"
  fi
  
  echo -e "\n-----------------------------------\n"
}

# Print script header
echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}  Credit System Integration API Testing Tool  ${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "${YELLOW}Base URL:${NC} $BASE_URL"
echo -e "${YELLOW}Test Phone:${NC} $PHONE_NUMBER"

# Test credit balance endpoint
print_header "1. Credit Balance Endpoint"
make_request "$BASE_URL/api/credits/balance" "GET" "" "Get current credit balance"

# Test credit check endpoint (GET)
print_header "2. Credit Check Endpoint (GET)"
make_request "$BASE_URL/api/credits/check?phoneNumber=$PHONE_NUMBER" "GET" "" "Check credits for $PHONE_NUMBER (GET method)"

# Test credit check endpoint (POST)
print_header "3. Credit Check Endpoint (POST)"
make_request "$BASE_URL/api/credits/check" "POST" "{\"phoneNumber\":\"$PHONE_NUMBER\"}" "Check credits for $PHONE_NUMBER (POST method)"

# Test call history endpoint
print_header "4. Call History Endpoint"
make_request "$BASE_URL/api/calls/history?page=$PAGE&limit=$LIMIT" "GET" "" "Get call history (page $PAGE, limit $LIMIT)"

echo -e "\n${GREEN}All tests completed!${NC}" 