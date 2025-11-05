// Comprehensive Test Script for Team Import Fix
// This script tests the fix for guest users with invalid team ID (999999)

import axios from 'axios';

// Test configuration
const BASE_URL = 'http://localhost:3000'; // Adjust if your server runs on a different port

// Test results storage
const testResults = {
  validationFunctions: {},
  guestUserImport: {},
  regularUserImport: {},
  errorHandling: {},
  edgeCases: {}
};

// Helper function to log test results
function logTestResult(testName, status, details, evidence = {}) {
  console.log(`\n${testName}: ${status}`);
  console.log(`Details: ${details}`);
  if (Object.keys(evidence).length > 0) {
    console.log('Evidence:', JSON.stringify(evidence, null, 2));
  }
  return { status, details, evidence };
}

// Helper function to test validation functions directly
async function testValidationFunctions() {
  console.log('\n=== Testing Validation Functions ===');
  
  try {
    // Import the validation functions from fpl-api.ts
    // Since we can't directly import TypeScript in Node.js, we'll test via API calls
    
    // Test 1: Check if guest team ID (999999) is properly identified
    console.log('\nTest 1: Guest Team ID Detection');
    try {
      const response = await axios.post(`${BASE_URL}/api/team/import`, {
        userId: 'test-user-id',
        fplTeamId: 999999
      });
      
      if (response.status === 200 && response.data.fplData.isGuestUser) {
        testResults.validationFunctions.guestDetection = logTestResult(
          'Guest Team ID Detection',
          'PASSED',
          'Guest team ID (999999) is properly detected and handled',
          {
            statusCode: response.status,
            isGuestUser: response.data.fplData.isGuestUser,
            teamName: response.data.fplData.teamName
          }
        );
      } else {
        testResults.validationFunctions.guestDetection = logTestResult(
          'Guest Team ID Detection',
          'FAILED',
          'Guest team ID (999999) was not properly detected',
          {
            statusCode: response.status,
            isGuestUser: response.data.fplData?.isGuestUser,
            response: response.data
          }
        );
      }
    } catch (error) {
      testResults.validationFunctions.guestDetection = logTestResult(
        'Guest Team ID Detection',
        'FAILED',
        `Error testing guest team ID detection: ${error.message}`,
        { error: error.message }
      );
    }
    
    // Test 2: Check if invalid team IDs are rejected
    console.log('\nTest 2: Invalid Team ID Rejection');
    try {
      const response = await axios.post(`${BASE_URL}/api/team/import`, {
        userId: 'test-user-id',
        fplTeamId: -1
      }, { validateStatus: () => true }); // Don't throw on error status
      
      if (response.status === 400 && response.data.error.includes('Invalid FPL Team ID')) {
        testResults.validationFunctions.invalidRejection = logTestResult(
          'Invalid Team ID Rejection',
          'PASSED',
          'Invalid team ID (-1) is properly rejected',
          {
            statusCode: response.status,
            errorMessage: response.data.error
          }
        );
      } else {
        testResults.validationFunctions.invalidRejection = logTestResult(
          'Invalid Team ID Rejection',
          'FAILED',
          'Invalid team ID (-1) was not properly rejected',
          {
            statusCode: response.status,
            response: response.data
          }
        );
      }
    } catch (error) {
      testResults.validationFunctions.invalidRejection = logTestResult(
        'Invalid Team ID Rejection',
        'FAILED',
        `Error testing invalid team ID rejection: ${error.message}`,
        { error: error.message }
      );
    }
    
  } catch (error) {
    console.error('Error in validation function tests:', error);
  }
}

// Test guest user team import
async function testGuestUserImport() {
  console.log('\n=== Testing Guest User Team Import ===');
  
  try {
    // Test 1: Guest user with team ID 999999 should get sample data
    console.log('\nTest 1: Guest User Sample Data');
    try {
      const response = await axios.post(`${BASE_URL}/api/team/import`, {
        userId: 'guest-user-test-id',
        fplTeamId: 999999
      });
      
      if (response.status === 200) {
        const { team, fplData } = response.data;
        
        // Check if sample data has the expected structure
        const hasValidTeamName = fplData.teamName === 'Guest FC';
        const hasValidPoints = typeof fplData.totalPoints === 'number';
        const hasValidRank = typeof fplData.overallRank === 'number';
        const hasGuestFlag = fplData.isGuestUser === true;
        const hasSquadData = team && team.currentSquad;
        
        if (hasValidTeamName && hasValidPoints && hasValidRank && hasGuestFlag && hasSquadData) {
          testResults.guestUserImport.sampleData = logTestResult(
            'Guest User Sample Data',
            'PASSED',
            'Guest user receives properly structured sample data',
            {
              teamName: fplData.teamName,
              totalPoints: fplData.totalPoints,
              overallRank: fplData.overallRank,
              isGuestUser: fplData.isGuestUser,
              hasSquadData: !!hasSquadData
            }
          );
        } else {
          testResults.guestUserImport.sampleData = logTestResult(
            'Guest User Sample Data',
            'FAILED',
            'Guest user sample data is missing required fields',
            {
              hasValidTeamName,
              hasValidPoints,
              hasValidRank,
              hasGuestFlag,
              hasSquadData,
              response: response.data
            }
          );
        }
      } else {
        testResults.guestUserImport.sampleData = logTestResult(
          'Guest User Sample Data',
          'FAILED',
          `Guest user import failed with status: ${response.status}`,
          { response: response.data }
        );
      }
    } catch (error) {
      testResults.guestUserImport.sampleData = logTestResult(
        'Guest User Sample Data',
        'FAILED',
        `Error testing guest user import: ${error.message}`,
        { error: error.message }
      );
    }
    
    // Test 2: Verify squad data structure
    console.log('\nTest 2: Guest User Squad Data Structure');
    try {
      const response = await axios.post(`${BASE_URL}/api/team/import`, {
        userId: 'guest-user-test-id-2',
        fplTeamId: 999999
      });
      
      if (response.status === 200) {
        const squadData = JSON.parse(response.data.team.currentSquad);
        
        // Check if squad has 15 players
        const hasCorrectSize = squadData.length === 15;
        
        // Check if squad has required positions
        const hasGK = squadData.some(p => p.position === 'GK');
        const hasDEF = squadData.some(p => p.position === 'DEF');
        const hasMID = squadData.some(p => p.position === 'MID');
        const hasFWD = squadData.some(p => p.position === 'FWD');
        
        // Check if players have required fields
        const hasValidPlayers = squadData.every(p => 
          p.id && p.name && p.position && p.team && 
          typeof p.cost === 'number' && typeof p.points === 'number'
        );
        
        if (hasCorrectSize && hasGK && hasDEF && hasMID && hasFWD && hasValidPlayers) {
          testResults.guestUserImport.squadStructure = logTestResult(
            'Guest User Squad Data Structure',
            'PASSED',
            'Guest user squad data has correct structure',
            {
              squadSize: squadData.length,
              hasGK,
              hasDEF,
              hasMID,
              hasFWD,
              hasValidPlayers
            }
          );
        } else {
          testResults.guestUserImport.squadStructure = logTestResult(
            'Guest User Squad Data Structure',
            'FAILED',
            'Guest user squad data structure is invalid',
            {
              hasCorrectSize,
              hasGK,
              hasDEF,
              hasMID,
              hasFWD,
              hasValidPlayers,
              squadSize: squadData.length
            }
          );
        }
      }
    } catch (error) {
      testResults.guestUserImport.squadStructure = logTestResult(
        'Guest User Squad Data Structure',
        'FAILED',
        `Error testing squad structure: ${error.message}`,
        { error: error.message }
      );
    }
    
  } catch (error) {
    console.error('Error in guest user import tests:', error);
  }
}

// Test regular user team import
async function testRegularUserImport() {
  console.log('\n=== Testing Regular User Team Import ===');
  
  try {
    // Test 1: Regular user with valid team ID should fetch from FPL API
    console.log('\nTest 1: Regular User Valid Team ID');
    try {
      // Use a known valid FPL team ID (this might need to be updated)
      const validTeamId = 1; // This is a common test ID, might need adjustment
      
      const response = await axios.post(`${BASE_URL}/api/team/import`, {
        userId: 'regular-user-test-id',
        fplTeamId: validTeamId
      }, { timeout: 10000 }); // 10 second timeout
      
      if (response.status === 200) {
        const { team, fplData } = response.data;
        
        // Check if response has expected structure
        const hasTeamName = fplData.teamName;
        const hasPoints = typeof fplData.totalPoints === 'number';
        const hasRank = typeof fplData.overallRank === 'number';
        const notGuestUser = fplData.isGuestUser !== true;
        
        if (hasTeamName && hasPoints && hasRank && notGuestUser) {
          testResults.regularUserImport.validTeamId = logTestResult(
            'Regular User Valid Team ID',
            'PASSED',
            'Regular user with valid team ID can import data',
            {
              teamName: fplData.teamName,
              totalPoints: fplData.totalPoints,
              overallRank: fplData.overallRank,
              isGuestUser: fplData.isGuestUser
            }
          );
        } else {
          testResults.regularUserImport.validTeamId = logTestResult(
            'Regular User Valid Team ID',
            'FAILED',
            'Regular user import response is missing required fields',
            {
              hasTeamName,
              hasPoints,
              hasRank,
              notGuestUser,
              response: response.data
            }
          );
        }
      } else {
        testResults.regularUserImport.validTeamId = logTestResult(
          'Regular User Valid Team ID',
          'FAILED',
          `Regular user import failed with status: ${response.status}`,
          { response: response.data }
        );
      }
    } catch (error) {
      // This might fail if the FPL API is unavailable or the team ID is invalid
      // Let's check if it's an API unavailability error vs. an implementation error
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        testResults.regularUserImport.validTeamId = logTestResult(
          'Regular User Valid Team ID',
          'SKIPPED',
          'Test skipped due to FPL API timeout (this is expected if API is unavailable)',
          { error: error.message }
        );
      } else {
        testResults.regularUserImport.validTeamId = logTestResult(
          'Regular User Valid Team ID',
          'FAILED',
          `Error testing regular user import: ${error.message}`,
          { error: error.message }
        );
      }
    }
    
  } catch (error) {
    console.error('Error in regular user import tests:', error);
  }
}

// Test error handling
async function testErrorHandling() {
  console.log('\n=== Testing Error Handling ===');
  
  try {
    // Test 1: Non-existent team ID should return appropriate error
    console.log('\nTest 1: Non-existent Team ID Error');
    try {
      const nonExistentTeamId = 999999999; // Very high number that likely doesn't exist
      
      const response = await axios.post(`${BASE_URL}/api/team/import`, {
        userId: 'error-test-user',
        fplTeamId: nonExistentTeamId
      }, { validateStatus: () => true }); // Don't throw on error status
      
      if (response.status === 404 && response.data.error.includes('not found')) {
        testResults.errorHandling.nonExistentTeamId = logTestResult(
          'Non-existent Team ID Error',
          'PASSED',
          'Non-existent team ID returns appropriate error',
          {
            statusCode: response.status,
            errorMessage: response.data.error
          }
        );
      } else {
        testResults.errorHandling.nonExistentTeamId = logTestResult(
          'Non-existent Team ID Error',
          'FAILED',
          'Non-existent team ID did not return expected error',
          {
            statusCode: response.status,
            response: response.data
          }
        );
      }
    } catch (error) {
      testResults.errorHandling.nonExistentTeamId = logTestResult(
        'Non-existent Team ID Error',
        'FAILED',
        `Error testing non-existent team ID: ${error.message}`,
        { error: error.message }
      );
    }
    
    // Test 2: Invalid request body should return validation error
    console.log('\nTest 2: Invalid Request Body');
    try {
      const response = await axios.post(`${BASE_URL}/api/team/import`, {
        // Missing required fields
        invalidField: 'invalid'
      }, { validateStatus: () => true }); // Don't throw on error status
      
      if (response.status === 400 && response.data.error.includes('Invalid input data')) {
        testResults.errorHandling.invalidRequestBody = logTestResult(
          'Invalid Request Body',
          'PASSED',
          'Invalid request body returns validation error',
          {
            statusCode: response.status,
            errorMessage: response.data.error
          }
        );
      } else {
        testResults.errorHandling.invalidRequestBody = logTestResult(
          'Invalid Request Body',
          'FAILED',
          'Invalid request body did not return expected validation error',
          {
            statusCode: response.status,
            response: response.data
          }
        );
      }
    } catch (error) {
      testResults.errorHandling.invalidRequestBody = logTestResult(
        'Invalid Request Body',
        'FAILED',
        `Error testing invalid request body: ${error.message}`,
        { error: error.message }
      );
    }
    
  } catch (error) {
    console.error('Error in error handling tests:', error);
  }
}

// Test edge cases
async function testEdgeCases() {
  console.log('\n=== Testing Edge Cases ===');
  
  try {
    // Test 1: Zero team ID
    console.log('\nTest 1: Zero Team ID');
    try {
      const response = await axios.post(`${BASE_URL}/api/team/import`, {
        userId: 'edge-case-test-user',
        fplTeamId: 0
      }, { validateStatus: () => true }); // Don't throw on error status
      
      if (response.status === 400 && response.data.error.includes('Invalid FPL Team ID')) {
        testResults.edgeCases.zeroTeamId = logTestResult(
          'Zero Team ID',
          'PASSED',
          'Zero team ID is properly rejected',
          {
            statusCode: response.status,
            errorMessage: response.data.error
          }
        );
      } else {
        testResults.edgeCases.zeroTeamId = logTestResult(
          'Zero Team ID',
          'FAILED',
          'Zero team ID was not properly rejected',
          {
            statusCode: response.status,
            response: response.data
          }
        );
      }
    } catch (error) {
      testResults.edgeCases.zeroTeamId = logTestResult(
        'Zero Team ID',
        'FAILED',
        `Error testing zero team ID: ${error.message}`,
        { error: error.message }
      );
    }
    
    // Test 2: Very large team ID
    console.log('\nTest 2: Very Large Team ID');
    try {
      const response = await axios.post(`${BASE_URL}/api/team/import`, {
        userId: 'edge-case-test-user-2',
        fplTeamId: Number.MAX_SAFE_INTEGER
      }, { validateStatus: () => true }); // Don't throw on error status
      
      if (response.status === 400 && response.data.error.includes('Invalid FPL Team ID')) {
        testResults.edgeCases.largeTeamId = logTestResult(
          'Very Large Team ID',
          'PASSED',
          'Very large team ID is properly rejected',
          {
            statusCode: response.status,
            errorMessage: response.data.error
          }
        );
      } else {
        testResults.edgeCases.largeTeamId = logTestResult(
          'Very Large Team ID',
          'FAILED',
          'Very large team ID was not properly rejected',
          {
            statusCode: response.status,
            response: response.data
          }
        );
      }
    } catch (error) {
      testResults.edgeCases.largeTeamId = logTestResult(
        'Very Large Team ID',
        'FAILED',
        `Error testing very large team ID: ${error.message}`,
        { error: error.message }
      );
    }
    
  } catch (error) {
    console.error('Error in edge case tests:', error);
  }
}

// Generate comprehensive test report
function generateTestReport() {
  console.log('\n' + '='.repeat(60));
  console.log('TEAM IMPORT FIX TEST REPORT');
  console.log('='.repeat(60));
  
  // Count passed, failed, and skipped tests
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;
  
  // Helper function to count tests in a category
  function countTestsInCategory(category) {
    Object.values(category).forEach(test => {
      totalTests++;
      if (test.status === 'PASSED') {
        passedTests++;
      } else if (test.status === 'FAILED') {
        failedTests++;
      } else if (test.status === 'SKIPPED') {
        skippedTests++;
      }
    });
  }
  
  // Count all tests
  countTestsInCategory(testResults.validationFunctions);
  countTestsInCategory(testResults.guestUserImport);
  countTestsInCategory(testResults.regularUserImport);
  countTestsInCategory(testResults.errorHandling);
  countTestsInCategory(testResults.edgeCases);
  
  console.log(`\nEXECUTIVE SUMMARY:`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Skipped: ${skippedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  console.log(`\nDETAILED RESULTS:`);
  
  // Function to print category results
  function printCategoryResults(categoryName, category) {
    console.log(`\n${categoryName.toUpperCase()}:`);
    Object.entries(category).forEach(([testName, result]) => {
      console.log(`  ${testName}: ${result.status}`);
      console.log(`    Details: ${result.details}`);
    });
  }
  
  printCategoryResults('Validation Functions', testResults.validationFunctions);
  printCategoryResults('Guest User Import', testResults.guestUserImport);
  printCategoryResults('Regular User Import', testResults.regularUserImport);
  printCategoryResults('Error Handling', testResults.errorHandling);
  printCategoryResults('Edge Cases', testResults.edgeCases);
  
  console.log(`\nKEY FINDINGS:`);
  
  // Check if the main fix is working
  const guestDetectionTest = testResults.validationFunctions.guestDetection;
  if (guestDetectionTest && guestDetectionTest.status === 'PASSED') {
    console.log('✅ Guest user detection is working correctly');
  } else {
    console.log('❌ Guest user detection is NOT working correctly');
  }
  
  // Check if sample data is provided
  const sampleDataTest = testResults.guestUserImport.sampleData;
  if (sampleDataTest && sampleDataTest.status === 'PASSED') {
    console.log('✅ Sample data is provided to guest users');
  } else {
    console.log('❌ Sample data is NOT provided to guest users');
  }
  
  // Check if squad structure is correct
  const squadStructureTest = testResults.guestUserImport.squadStructure;
  if (squadStructureTest && squadStructureTest.status === 'PASSED') {
    console.log('✅ Squad data structure is correct');
  } else {
    console.log('❌ Squad data structure is NOT correct');
  }
  
  // Check if invalid IDs are rejected
  const invalidRejectionTest = testResults.validationFunctions.invalidRejection;
  if (invalidRejectionTest && invalidRejectionTest.status === 'PASSED') {
    console.log('✅ Invalid team IDs are properly rejected');
  } else {
    console.log('❌ Invalid team IDs are NOT properly rejected');
  }
  
  console.log(`\nCONCLUSION:`);
  
  if (guestDetectionTest && guestDetectionTest.status === 'PASSED' &&
      sampleDataTest && sampleDataTest.status === 'PASSED') {
    console.log('✅ The fix for guest users with invalid team ID (999999) is working correctly');
    console.log('✅ Guest users can now successfully import team data without errors');
    console.log('✅ The original issue has been resolved');
  } else {
    console.log('❌ The fix for guest users with invalid team ID (999999) is NOT working correctly');
    console.log('❌ Further investigation and fixes are needed');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('END OF REPORT');
  console.log('='.repeat(60));
  
  return {
    totalTests,
    passedTests,
    failedTests,
    skippedTests,
    successRate: (passedTests / totalTests) * 100,
    fixWorking: guestDetectionTest && guestDetectionTest.status === 'PASSED' &&
                sampleDataTest && sampleDataTest.status === 'PASSED'
  };
}

// Main test execution function
async function runTests() {
  console.log('Starting Team Import Fix Tests...');
  console.log('Make sure the server is running on', BASE_URL);
  
  try {
    await testValidationFunctions();
    await testGuestUserImport();
    await testRegularUserImport();
    await testErrorHandling();
    await testEdgeCases();
    
    const report = generateTestReport();
    
    // Export for potential programmatic use
    if (typeof window === 'undefined') {
      globalThis.testResults = testResults;
      globalThis.report = report;
    }
    
    return report;
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests, testResults };