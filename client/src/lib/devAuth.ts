// Development-only authentication helper
export async function ensureDevAuth(): Promise<boolean> {
  if (import.meta.env.PROD) return false;
  
  try {
    // Check if we're already authenticated
    const userResponse = await fetch('/api/user', { credentials: 'include' });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      if (userData.user) {
        console.log('✅ Already authenticated as:', userData.user.email);
        return true;
      }
    }
    
    // Not authenticated, perform dev login
    console.log('🔐 Setting up dev authentication...');
    const loginResponse = await fetch('/auth/dev-login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Dev authentication successful:', loginData.user.email);
      return true;
    } else {
      console.error('❌ Dev authentication failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Dev authentication error:', error);
    return false;
  }
}