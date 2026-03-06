/**
 * API Gateway Lambda Authorizer
 * Validates that requests come from CloudFront by checking a custom header
 */

const EXPECTED_SECRET = process.env.API_SECRET;

exports.handler = async (event) => {
  console.log('Authorizer event:', JSON.stringify(event, null, 2));
  
  try {
    // Extract the custom header
    const headers = event.headers || {};
    const cloudFrontSecret = headers['x-cloudfront-secret'] || headers['X-CloudFront-Secret'];
    
    // Validate the secret
    if (!cloudFrontSecret) {
      console.log('Missing X-CloudFront-Secret header');
      return {
        isAuthorized: false
      };
    }
    
    if (cloudFrontSecret !== EXPECTED_SECRET) {
      console.log('Invalid X-CloudFront-Secret header');
      return {
        isAuthorized: false
      };
    }
    
    console.log('Request authorized from CloudFront');
    return {
      isAuthorized: true
    };
    
  } catch (error) {
    console.error('Authorizer error:', error);
    return {
      isAuthorized: false
    };
  }
};
