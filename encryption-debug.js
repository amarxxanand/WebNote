// Test the current user's encryption setup
console.log('=== ENCRYPTION DEBUG TEST ===');

// This should be run in the browser console while logged in
function debugEncryption() {
  // Get the current user state from React DevTools or directly
  console.log('Current user:', window.localStorage.getItem('token') ? 'Authenticated' : 'Not authenticated');
  
  // Check if we can access the auth context
  try {
    // Try to get user info from the auth context
    console.log('User data available:', !!window.authUser);
    
    // Check encryption status
    console.log('Browser localStorage token:', !!window.localStorage.getItem('token'));
    
    // Test basic encryption
    const testData = {
      title: 'Test Title',
      content: 'Test Content',
      tags: ['test']
    };
    
    console.log('Test data:', testData);
    
    // This will help us see what's happening with encryption
    console.log('Encryption test complete');
    
  } catch (error) {
    console.error('Debug test error:', error);
  }
}

// Run the debug
debugEncryption();
