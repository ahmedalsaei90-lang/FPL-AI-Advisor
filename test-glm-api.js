// Test script for GLM API
// Run with: node test-glm-api.js

async function testGLMAPI() {
  const apiKey = 'aef1479a1d0e4261a7c2725775ed35d5.IqblbBCm0a3VZ9Zi';
  const apiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

  console.log('Testing GLM API with new key...\n');

  // Try common GLM models (including free tier models)
  const modelsToTry = [
    'glm-4-flash',      // Flash model (fast)
    'glm-4-air',        // Air model (lightweight)
    'glm-4-airx',       // AirX model
    'glm-4-flashx',     // FlashX model
    'glm-4-0520',       // Specific version
    'glm-4v',           // Vision model (if supported)
    'glm-4',            // Base model
    'glm-4-plus',       // Plus model (may require payment)
    'glm-3-turbo',      // GLM-3 turbo
  ];

  for (const model of modelsToTry) {
    console.log(`\n=== Testing model: ${model} ===\n`);

    const requestBody = {
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.'
        },
        {
          role: 'user',
          content: 'Say "Hello! API is working!" if you can read this.'
        }
      ],
      temperature: 0.7,
      max_tokens: 100,
      stream: false
    };

    try {
      console.log('Making request to:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed with status:', response.status);
        console.error('Error:', errorData.error?.message || 'Unknown error');
        continue;
      }

      const data = await response.json();

      if (data.choices && data.choices[0]) {
        console.log('✅ SUCCESS!');
        console.log('AI Response:', data.choices[0].message.content);
        console.log('Tokens used:', data.usage?.total_tokens || 'N/A');
        console.log('\n🎉 Working model found:', model);
        console.log('API key is functional!');
        return model;
      } else {
        console.log('⚠️ Unexpected response structure');
      }

    } catch (error) {
      console.error('❌ Exception:', error.message);
      continue;
    }
  }

  console.log('\n❌ None of the tested models worked. Please check the API documentation.');
  process.exit(1);
}

testGLMAPI();
