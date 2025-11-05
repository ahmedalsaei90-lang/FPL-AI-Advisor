// Test script for FPL API validation functions
// This script tests the validation functions added to fpl-api.ts

// Since we can't directly import TypeScript in Node.js, we'll test via API calls
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

console.log('Starting FPL API Validation Tests...');
console.log('Make sure the server is running on', BASE_URL);

async function testValidationFunctions() {
  console.log('\n=== Testing Validation Functions ===');
  
  const testCases = [
    {
      name: 'Guest Team ID (999999)',
      teamId: 999999,
      expectedStatus: 200,
      expectedGuestFlag: true
    },
    {
      name: 'Valid Team ID (1)',
      teamId: 1,
      expectedStatus: 200, // May fail due to API availability, but should pass validation
      expectedGuestFlag: false
    },
    {
      name: 'Invalid Team ID (-1)',
      teamId: -1,
      expectedStatus: 400,
      expectedError: 'Invalid FPL Team ID'
    },
    {
      name: 'Zero Team ID (0)',
      teamId: 0,
      expectedStatus: 400,
      expectedError: 'Invalid FPL Team ID'
    },
    {
      name: 'Very Large Team ID',
      teamId: Number.MAX_SAFE_INTEGER,
      expectedStatus: 400,
      expectedError: 'Invalid FPL Team ID'
    }
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`\nTest: ${testCase.name}`);
    console.log(`Team ID: ${testCase.teamId}`);
    
    try {
      const response = await axios.post(`${BASE_URL}/api/team/import`, {
        userId: `test-user-${testCase.teamId}`,
        fplTeamId: testCase.teamId
      }, { validateStatus: () => true }); // Don't throw on error status
      
      console.log(`Status: ${response.status}`);
      
      let passed = false;
      let details = '';
      
      if (response.status === testCase.expectedStatus) {
        if (testCase.expectedStatus === 200) {
          // Check if guest flag is set correctly
          const isGuestUser = response.data.fplData?.isGuestUser;
          if (isGuestUser === testCase.expectedGuestFlag) {
            passed = true;
            details = `Response status ${response.status} matches expected ${testCase.expectedStatus} and guest flag ${isGuestUser} matches expected ${testCase.expectedGuestFlag}`;
          } else {
            details = `Response status ${response.status} matches expected ${testCase.expectedStatus} but guest flag ${isGuestUser} does not match expected ${testCase.expectedGuestFlag}`;
          }
        } else {
          // For error cases, check if error message is correct
          if (testCase.expectedError && response.data.error && response.data.error.includes(testCase.expectedError)) {
            passed = true;
            details = `Response status ${response.status} matches expected ${testCase.expectedStatus} and error message is correct`;
          } else {
            details = `Response status ${response.status} matches expected ${testCase.expectedStatus} but error message is incorrect`;
          }
        }
      } else {
        details = `Response status ${response.status} does not match expected ${testCase.expectedStatus}`;
      }
      
      console.log(`Result: ${passed ? 'PASSED' : 'FAILED'}`);
      console.log(`Details: ${details}`);
      
      results.push({
        name: testCase.name,
        teamId: testCase.teamId,
        status: passed ? 'PASSED' : 'FAILED',
        details,
        responseStatus: response.status,
        responseData: response.data
      });
      
    } catch (error) {
      console.log(`Error: ${error.message}`);
      results.push({
        name: testCase.name,
        teamId: testCase.teamId,
        status: 'ERROR',
        details: error.message,
        error: error.message
      });
    }
  }
  
  return results;
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('FPL API VALIDATION TEST REPORT');
  console.log('='.repeat(60));
  
  const results = await testValidationFunctions();
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  let passedTests = 0;
  let failedTests = 0;
  let errorTests = 0;
  
  results.forEach(result => {
    console.log(`\n${result.name}: ${result.status}`);
    console.log(`Details: ${result.details}`);
    
    if (result.status === 'PASSED') {
      passedTests++;
    } else if (result.status === 'FAILED') {
      failedTests++;
    } else {
      errorTests++;
    }
  });
  
  const totalTests = results.length;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Errors: ${errorTests}`);
  console.log(`Success Rate: ${successRate}%`);
  
  // Check if key validation functions are working
  const guestIdTest = results.find(r => r.name === 'Guest Team ID (999999)');
  const invalidIdTest = results.find(r => r.name === 'Invalid Team ID (-1)');
  
  console.log('\nKEY FINDINGS:');
  
  if (guestIdTest && guestIdTest.status === 'PASSED') {
    console.log('✅ Guest team ID (999999) is properly detected and handled');
  } else {
    console.log('❌ Guest team ID (999999) is NOT properly detected and handled');
  }
  
  if (invalidIdTest && invalidIdTest.status === 'PASSED') {
    console.log('✅ Invalid team IDs are properly rejected');
  } else {
    console.log('❌ Invalid team IDs are NOT properly rejected');
  }
  
  const allCriticalTestsPassed = 
    (guestIdTest && guestIdTest.status === 'PASSED') &&
    (invalidIdTest && invalidIdTest.status === 'PASSED');
  
  console.log(`\nOVERALL RESULT: ${allCriticalTestsPassed ? 'PASSED' : 'FAILED'}`);
  
  if (allCriticalTestsPassed) {
    console.log('✅ The validation functions are working correctly');
    console.log('✅ Guest users with team ID 999999 are properly handled');
    console.log('✅ Invalid team IDs are properly rejected');
  } else {
    console.log('❌ The validation functions are NOT working correctly');
    console.log('❌ Further investigation and fixes are needed');
  }
  
  console.log('='.repeat(60));
  
  return {
    totalTests,
    passedTests,
    failedTests,
    errorTests,
    successRate: parseFloat(successRate),
    allCriticalTestsPassed
  };
}

// Run tests
runTests().catch(console.error);