// Test ML classification with improved logic
const testMLClassification = async () => {
  try {
    // Create a mock image file (just for testing)
    const mockImageData = Buffer.from('fake-image-data');
    
    const formData = new FormData();
    formData.append('image', new Blob([mockImageData]), 'test-pothole.jpg');
    
    console.log('Testing ML classification...');
    
    const response = await fetch('http://localhost:5000/classify-issue', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('ML Classification Result:', result);
    
    // Test multiple times to see consistency
    console.log('\n--- Testing multiple predictions ---');
    for (let i = 0; i < 5; i++) {
      const testResponse = await fetch('http://localhost:5000/classify-issue', {
        method: 'POST',
        body: formData
      });
      const testResult = await testResponse.json();
      console.log(`Test ${i + 1}: ${testResult.prediction.predicted_class} (${testResult.prediction.confidence})`);
    }
    
  } catch (error) {
    console.error('ML Test Error:', error);
  }
};

testMLClassification();
