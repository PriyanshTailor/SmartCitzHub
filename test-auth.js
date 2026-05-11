// Test authentication endpoints
const testAuth = async () => {
  try {
    const signupData = {
      email: 'test@example.com',
      password: '123456',
      full_name: 'Test User',
      user_type: 'citizen'
    };
    
    console.log('Sending signup data:', signupData);
    console.log('JSON string:', JSON.stringify(signupData));
    
    // Test signup
    const signupResponse = await fetch('http://localhost:4000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData)
    });
    
    console.log('Signup Status:', signupResponse.status);
    const signupResult = await signupResponse.json();
    console.log('Signup Response:', signupResult);
    
    // Test login
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: '123456'
      })
    });
    
    console.log('Login Status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login Response:', loginData);
    
  } catch (error) {
    console.error('Test Error:', error);
  }
};

testAuth();
