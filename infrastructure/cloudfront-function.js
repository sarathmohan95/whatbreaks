// CloudFront Function to strip /api prefix before forwarding to API Gateway
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Strip /api prefix if present
    if (uri.startsWith('/api/')) {
        request.uri = uri.substring(4); // Remove '/api'
    } else if (uri === '/api') {
        request.uri = '/';
    }
    
    return request;
}
