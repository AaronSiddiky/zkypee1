# Dial Feature Reimplementation Plan

## Overview

This document outlines a step-by-step plan for reimplementing the dial feature from scratch. The new implementation will:

1. Use Twilio's Programmable Voice to enable logged-in users to make calls to any number worldwide
2. Allow users to select country codes before dialing
3. Integrate with the existing credit system
4. Utilize Supabase user schema for credit management
5. Use rates.csv to apply the correct call rates
6. Implement server-side authentication tokens for improved security

## Phase 1: Project Setup and Infrastructure

### 1.1 Environment Setup (1 day)

- Configure necessary environment variables for Twilio integration: ( all the env variables are set correctly - message from dev)
  - TWILIO_ACCOUNT_SID
  - TWILIO_AUTH_TOKEN
  - TWILIO_API_KEY
  - TWILIO_API_SECRET
  - TWILIO_PHONE_NUMBER
  - TWILIO_TWIML_APP_SID
- Ensure Supabase connection is properly configured
- Create a development branch for isolation

### 1.2 Database Schema Verification (0.5 days)

- Ensure the Supabase schema includes the necessary tables:
  - users (with credit_balance field)
  - call_logs (for tracking call history)
  - transactions (for credit purchases)
- Add any missing fields or indices for optimization ( use the fields that are in user table)

## Phase 2: Rate Management System

### 2.1 Rate Data Preparation (0.5 days)

- Process the rates.csv file to create a structured data format
- Implement utility functions to:
  - Parse country codes and rates
  - Look up rates by country code
  - Calculate call costs as simply as possible

### 2.2 Rate Service Implementation (1 day)

- Create a RateService class with:
  - Function to get rate by country/number
  - Helper to calculate potential cost for call duration ( extract credits from the user supabase) and use it do do the simple calculation
  - Formatter for displaying rates to users
- Build a server endpoint to serve rate information:
  - GET /api/rates/lookup (by country code)
  - GET /api/rates/countries (list all available countries)

## Phase 3: Twilio Integration

### 3.1 Server-Side Token Management (1 day)

- Implement secure token generation:
  - check code base first, Create /api/twilio/token endpoint
  - check code base first, Use server-side token storage mechanism
  - Implement token expiration and renewal
- check if it exists first, Set up CORS and rate limiting for security

### 3.2 TwiML Configuration (0.5 days)

- check if twiml application exists firstCreate TwiML application in Twilio dashboard
- Implement TwiML endpoint:
  - Set up /api/twilio/twiml endpoint
  - Configure call recording (if needed)
  - Set up proper voice parameters

### 3.3 Call Management API (1.5 days) (use existing functionality and alter it if needed)

- Implement call initiation:
  - Create /api/twilio/voice endpoint
  - Add pre-call credit check
  - Implement proper error handling
- Create call status monitoring:
  - Set up /api/twilio/status-callback endpoint
  - Record call duration and status
  - Implement call termination for insufficient credits
- Add call control features:
  - /api/twilio/hangup for ending calls
  - /api/twilio/mute for toggling mute

## Phase 4: Credit System Integration

### 4.1 Credit Check Service (0.5 days)

- Implement pre-call credit verification:
  - Check if user has enough credits for minimum call duration
  - Calculate estimated talk time based on country rate
- Create low balance warning system

### 4.2 Credit Deduction System (1 day)

- Build credit deduction mechanism:
  - Deduct credits based on actual call duration
  - Use accurate country-specific rates from rates.csv
  - Handle partial minute billing (rounding logic)
- Implement credit update transaction system:
  - Ensure atomic updates to prevent race conditions
  - Log all credit deductions for auditing

### 4.3 Call History and Reporting (1 day)

- Implement call logging system:
  - Record call details (duration, cost, status)
  - Store country and number information (with privacy measures)
- Create user-facing history view:
  - Display call history with costs
  - Show remaining credit balance

## Phase 5: User Interface

### 5.1 Dialer Component (1.5 days)

- Build numeric keypad interface:
  - Implement digit buttons with sounds
  - Add backspace and call buttons
  - Support keyboard input for accessibility
- Create country selector:
  - Display country flags and codes
  - Implement search/filter functionality
  - Show rates for selected country

### 5.2 Call Status UI (1 day)

- Design call-in-progress interface:
  - Show real-time call duration
  - Display current cost and rate
  - Add call controls (hangup, mute)
- Implement credit information display:
  - Show current balance
  - Indicate estimated talk time remaining
  - Provide low balance warnings

### 5.3 Context Providers (0.5 days)

- Implement TwilioContext for state management:
  - Track call status, duration, and errors
  - Manage connection states and events
  - Handle device initialization

## Phase 6: Testing and Security

### 6.1 Security Audit (1 day)

- Review authentication mechanisms:
  - Ensure all endpoints require authentication
  - Move token management to server-side only
  - Implement proper session validation
- Audit for common vulnerabilities:
  - Check for CSRF protections
  - Implement rate limiting
  - Add input validation

### 6.2 Testing Strategy (1 day)

- Unit testing:
  - Test rate calculation functions
  - Verify credit deduction logic
  - Mock Twilio service calls
- Integration testing:
  - Test end-to-end call flow
  - Verify credit system integration
  - Test error handling scenarios

### 6.3 Production Readiness (0.5 days)

- Set up logging and monitoring:
  - Add detailed logging for troubleshooting
  - Implement error tracking
  - Set up alerts for critical failures
- Performance optimization:
  - Add caching where appropriate
  - Optimize database queries
  - Minimize client-side bundle size

## Phase 7: Launch and Iteration

### 7.1 Deployment Plan (0.5 days)

- Create a staged rollout plan:
  - Deploy to testing environment
  - Conduct beta testing with select users
  - Plan for full production deployment
- Document rollback procedures

### 7.2 Documentation (0.5 days)

- Update API documentation
- Create user guide for dial feature
- Document system architecture

### 7.3 Post-Launch Monitoring (Ongoing)

- Monitor for errors and issues
- Track call quality and success rates
- Gather user feedback for improvements

## Timeline Summary

- Phase 1: 1.5 days
- Phase 2: 1.5 days
- Phase 3: 3 days
- Phase 4: 2.5 days
- Phase 5: 3 days
- Phase 6: 2.5 days
- Phase 7: 1 day

**Total estimated development time:** 15 days (3 weeks)

## Technical Considerations

### Security

- Server-side token management to prevent client-side exposure
- Proper authentication for all API endpoints
- Rate limiting to prevent abuse
- Input validation to prevent injection attacks

### Performance

- Use WebSockets for real-time call status updates
- Implement efficient credit calculation
- Cache country codes and rates data

### User Experience

- Intuitive dialer interface with familiar controls
- Clear display of costs and credit information
- Graceful error handling and recovery
- Low balance notifications before and during calls

### Cost Management

- Use accurate rates from rates.csv for billing
- Implement minimum call duration (e.g., 1 minute)
- Round partial minutes according to business rules
- Provide safeguards against unexpected charges
