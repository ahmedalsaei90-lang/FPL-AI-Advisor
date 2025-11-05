// Simple Test Script for Team Import Fix
// This script tests the fix for guest users with invalid team ID (999999)

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

console.log('Starting Team Import Fix Tests...');
console.log('Make sure the server is running on', BASE_URL);

async function testGuestUserImport() {
  console.log('\n=== Testing Guest User Team Import ===');
  
  try {
    // Test guest user with team ID 999999
    console.log('\nTest: Guest User with Team ID 999999');
    const response = await axios.post(`${BASE_URL}/api/team/import`, {
      userId: 'guest-user-test-id',
      fplTeamId: 999999
    });
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Check if guest user is properly handled
    if (response.status === 200 && response.data.fplData.isGuestUser) {
      console.log('✅ PASSED: Guest user with team ID 999999 is properly handled');
      console.log('✅ Sample data is provided instead of API error');
      return true;
    } else {
      console.log('❌ FAILED: Guest user with team ID 999999 was not properly handled');
      return false;
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function testInvalidTeamId() {
  console.log('\n=== Testing Invalid Team ID ===');
  
  try {
    // Test with invalid team ID (not 999999)
    console.log('\nTest: Invalid Team ID (-1)');
    const response = await axios.post(`${BASE_URL}/api/team/import`, {
      userId: 'test-user-id',
      fplTeamId: -1
    }, { validateStatus: () => true }); // Don't throw on error status
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Check if invalid team ID is properly rejected
    if (response.status === 400 && response.data.error.includes('Invalid FPL Team ID')) {
      console.log('✅ PASSED: Invalid team ID is properly rejected');
      return true;
    } else {
      console.log('❌ FAILED: Invalid team ID was not properly rejected');
      return false;
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('TEAM IMPORT FIX TEST REPORT');
  console.log('='.repeat(60));
  
  const guestTestResult = await testGuestUserImport();
  const invalidIdTestResult = await testInvalidTeamId();
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`Guest User Test: ${guestTestResult ? 'PASSED' : 'FAILED'}`);
  console.log(`Invalid ID Test: ${invalidIdTestResult ? 'PASSED' : 'FAILED'}`);
  
  const allTestsPassed = guestTestResult && invalidIdTestResult;
  
  console.log(`\nOVERALL RESULT: ${allTestsPassed ? 'PASSED' : 'FAILED'}`);
  
  if (allTestsPassed) {
    console.log('✅ The fix for guest users with invalid team ID (999999) is working correctly');
    console.log('✅ Guest users can now successfully import team data without errors');
    console.log('✅ The original issue has been resolved');
  } else {
    console.log('❌ The fix for guest users with invalid team ID (999999) is NOT working correctly');
    console.log('❌ Further investigation and fixes are needed');
  }
  
  console.log('='.repeat(60));
  
  return allTestsPassed;
}

// Run tests
runTests().catch(console.error);