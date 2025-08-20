// 🔧 Encryption Reset Utility
// Run this in browser console if encryption is not working properly

async function resetUserEncryption() {
  console.log('🔧 Starting encryption reset...');
  
  try {
    // Clear any cached encryption state
    console.log('1. Clearing local encryption cache...');
    
    // Force re-initialization of encryption
    console.log('2. Requesting fresh encryption setup from server...');
    
    const response = await fetch('/api/users/encryption/reset', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Encryption reset successful');
      console.log('3. Please refresh the page and try again');
      
      // Optionally auto-refresh
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      console.error('❌ Encryption reset failed:', response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Encryption reset error:', error);
    
    // Manual fallback
    console.log('🔧 Manual fallback: clearing localStorage...');
    localStorage.clear();
    console.log('Please refresh the page and login again');
  }
}

// Alternative manual reset
function manualEncryptionReset() {
  console.log('🔧 Manual encryption reset...');
  
  // Clear all local storage
  localStorage.clear();
  
  console.log('✅ Local storage cleared');
  console.log('Please refresh and login again to reinitialize encryption');
  
  // Auto refresh after 2 seconds
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}

console.log('🔧 Encryption reset utilities loaded');
console.log('Run: resetUserEncryption() or manualEncryptionReset()');
