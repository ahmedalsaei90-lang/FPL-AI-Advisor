/**
 * Simple Test Suite for "Try as Guest" Button Functionality
 * 
 * This test suite verifies the core functionality that we can confirm is working:
 * 1. Guest API endpoint creates guest users correctly
 * 2. Button click triggers proper API call and navigation
 * 3. Guest user session is properly created and stored
 * 4. The button navigates to dashboard (not login)
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const GUEST_API_ENDPOINT = `${BASE_URL}/api/auth/guest`;
const DASHBOARD_URL = `${BASE_URL}/dashboard`;

test.describe('Try as Guest Button Core Functionality', () => {
  test('should create a guest user successfully via API', async ({ request }) => {
    console.log('Testing guest API endpoint directly...');
    
    // Make a POST request to the guest API endpoint
    const response = await request.post(GUEST_API_ENDPOINT, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Verify the response status
    expect(response.status()).toBe(200);
    
    // Parse the response body
    const data = await response.json();
    
    // Verify the response structure
    expect(data).toHaveProperty('message', 'Guest access granted');
    expect(data).toHaveProperty('user');
    
    // Verify the user object structure
    const user = data.user;
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email', 'guest@fpl-advisor.com');
    expect(user).toHaveProperty('name', 'Guest User');
    expect(user).toHaveProperty('fpl_team_id', 999999);
    expect(user).toHaveProperty('fpl_team_name', 'Guest FC');
    expect(user).toHaveProperty('is_guest', true);
    
    console.log('✅ Guest API endpoint creates guest users correctly');
  });

  test('should navigate to dashboard when "Try as Guest" button is clicked', async ({ page }) => {
    console.log('Testing button click navigation flow...');
    
    // Navigate to the main page
    await page.goto(BASE_URL);
    
    // Wait for the page to load
    await page.waitForSelector('button:has-text("Try as Guest")');
    
    // Click the "Try as Guest" button
    await page.click('button:has-text("Try as Guest")');
    
    // Wait for navigation to complete
    await page.waitForURL(DASHBOARD_URL);
    
    // Verify we're on the dashboard page (not login)
    expect(page.url()).toBe(DASHBOARD_URL);
    
    console.log('✅ Button click navigates to dashboard correctly');
  });

  test('should create and store guest user session in localStorage', async ({ page }) => {
    console.log('Testing guest user session creation and storage...');
    
    // Navigate to the main page
    await page.goto(BASE_URL);
    
    // Wait for the page to load
    await page.waitForSelector('button:has-text("Try as Guest")');
    
    // Click the "Try as Guest" button
    await page.click('button:has-text("Try as Guest")');
    
    // Wait for navigation to complete
    await page.waitForURL(DASHBOARD_URL);
    
    // Check localStorage for user data
    const userData = await page.evaluate(() => {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    });
    
    // Verify user data exists in localStorage
    expect(userData).not.toBeNull();
    
    // Verify the user data structure
    expect(userData).toHaveProperty('id');
    expect(userData).toHaveProperty('email', 'guest@fpl-advisor.com');
    expect(userData).toHaveProperty('name', 'Guest User');
    expect(userData).toHaveProperty('fpl_team_id', 999999);
    expect(userData).toHaveProperty('fpl_team_name', 'Guest FC');
    expect(userData).toHaveProperty('is_guest', true);
    
    console.log('✅ Guest user session is properly created and stored in localStorage');
  });

  test('should work consistently across multiple attempts', async ({ page }) => {
    console.log('Testing flow consistency across multiple attempts...');
    
    // Test the flow 3 times to ensure consistency
    for (let i = 1; i <= 3; i++) {
      console.log(`Running test attempt ${i}...`);
      
      // Clear localStorage for each attempt
      await page.goto(BASE_URL);
      await page.evaluate(() => {
        localStorage.clear();
      });
      
      // Navigate to the main page
      await page.goto(BASE_URL);
      
      // Wait for the page to load
      await page.waitForSelector('button:has-text("Try as Guest")');
      
      // Click the "Try as Guest" button
      await page.click('button:has-text("Try as Guest")');
      
      // Wait for navigation to complete
      await page.waitForURL(DASHBOARD_URL);
      
      // Verify we're on the dashboard page
      expect(page.url()).toBe(DASHBOARD_URL);
      
      // Check localStorage for user data
      const userData = await page.evaluate(() => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
      });
      
      // Verify user data exists in localStorage
      expect(userData).not.toBeNull();
      expect(userData).toHaveProperty('is_guest', true);
      
      console.log(`✅ Attempt ${i} completed successfully`);
    }
    
    console.log('✅ Flow works consistently across multiple attempts');
  });
});