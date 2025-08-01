#!/usr/bin/env node

/**
 * Simple test script to demonstrate the health check endpoint
 * Usage: node test-health-endpoint.js [port]
 */

import http from 'http';

const port = process.argv[2] || 5000;
const host = 'localhost';

const options = {
  hostname: host,
  port: port,
  path: '/api/health',
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
};

console.log(`Testing health endpoint at http://${host}:${port}/api/health`);

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Status Message: ${res.statusMessage}`);
  console.log(`Headers:`, res.headers);
  console.log('---');

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const healthData = JSON.parse(data);
      console.log('Health Check Response:');
      console.log(JSON.stringify(healthData, null, 2));
      
      // Analyze the health status
      console.log('\n--- Health Analysis ---');
      console.log(`Overall Status: ${healthData.status}`);
      console.log(`Response Time: ${healthData.responseTime}ms`);
      console.log(`Uptime: ${healthData.uptime} seconds`);
      
      console.log('\nDependency Status:');
      Object.entries(healthData.dependencies || {}).forEach(([name, status]) => {
        console.log(`  ${name}: ${status.status} (${status.responseTime}ms) - ${status.message}`);
      });
      
      if (res.statusCode === 200) {
        console.log('\n✅ Service is healthy!');
        process.exit(0);
      } else if (res.statusCode === 503) {
        console.log('\n⚠️  Service is degraded or unhealthy');
        process.exit(1);
      } else {
        console.log(`\n❓ Unexpected status code: ${res.statusCode}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      console.log('Raw response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error(`Health check failed: ${error.message}`);
  
  if (error.code === 'ECONNREFUSED') {
    console.log(`\n❌ Cannot connect to server at ${host}:${port}`);
    console.log('Make sure the RentRight-AI server is running with: npm run dev');
  }
  
  process.exit(1);
});

req.setTimeout(10000, () => {
  console.error('Health check timed out after 10 seconds');
  req.destroy();
  process.exit(1);
});

req.end();