// Node.js 20+ has built-in fetch, no need for node-fetch

async function testGuestDashboard() {
  try {
    console.log('=== Testing Guest User Creation ===');
    
    // Step 1: Create a guest user
    const guestResponse = await fetch('http://localhost:3000/api/auth/guest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!guestResponse.ok) {
      throw new Error(`Guest creation failed with status: ${guestResponse.status}`);
    }
    
    const guestData = await guestResponse.json();
    console.log('✅ Guest user created successfully:', guestData);
    
    // Verify the response structure
    if (!guestData.user || !guestData.user.id || !guestData.user.email) {
      throw new Error('Invalid guest user response structure');
    }
    
    console.log('✅ Guest user response structure is valid');
    
    // Step 2: Test accessing the dashboard page
    console.log('\n=== Testing Dashboard Access ===');
    
    const dashboardResponse = await fetch('http://localhost:3000/dashboard', {
      headers: {
        'Cookie': `user=${JSON.stringify(guestData.user)}`
      }
    });
    
    if (!dashboardResponse.ok) {
      throw new Error(`Dashboard access failed with status: ${dashboardResponse.status}`);
    }
    
    const dashboardHtml = await dashboardResponse.text();
    
    // Check if the dashboard contains expected elements
    if (!dashboardHtml.includes('Welcome back')) {
      throw new Error('Dashboard does not contain expected welcome message');
    }
    
    if (!dashboardHtml.includes('Guest Session Active')) {
      throw new Error('Dashboard does not show guest session notice');
    }
    
    console.log('✅ Dashboard loaded successfully for guest user');
    console.log('✅ Guest session notice is displayed');
    
    // Step 3: Test with null/undefined user object
    console.log('\n=== Testing Dashboard with Null User ===');
    
    const nullUserResponse = await fetch('http://localhost:3000/dashboard');
    
    // Should redirect to login since no user is provided
    if (nullUserResponse.status !== 307 && nullUserResponse.status !== 302) {
      console.log(`⚠️  Expected redirect for null user, got status: ${nullUserResponse.status}`);
    } else {
      console.log('✅ Dashboard correctly redirects when user is null');
    }
    
    return {
      success: true,
      message: 'All tests passed successfully',
      guestUser: guestData.user
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testGuestDashboard().then(result => {
  console.log('\n=== Test Results ===');
  if (result.success) {
    console.log('✅ All tests passed!');
    console.log('Guest User ID:', result.guestUser.id);
  } else {
    console.log('❌ Tests failed:', result.error);
  }
  process.exit(result.success ? 0 : 1);
});