import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

const CODE_EXECUTION_URL = process.env.CODE_EXECUTION_URL || 'http://localhost:3002';

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    'Access-Control-Allow-Credentials': 'true',
  };

  try {
    // Validate request
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Request body is required' 
        }),
      };
    }

    console.log(`Forwarding code execution request to: ${CODE_EXECUTION_URL}/execute`);

    // Forward the request to EC2 code execution service
    const response = await fetch(`${CODE_EXECUTION_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': event.headers.authorization || event.headers.Authorization || '',
        'X-Forwarded-For': event.requestContext?.identity?.sourceIp || '',
        'X-Request-Id': event.requestContext?.requestId || '',
      },
      body: event.body,
    });

    const data = await response.json();

    console.log(`Code execution response status: ${response.status}`);

    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Code execution proxy error:', error);
    
    // Check if it's a connection error
    const isConnectionError = error instanceof Error && 
      (error.message.includes('ECONNREFUSED') || 
       error.message.includes('ETIMEDOUT') ||
       error.message.includes('fetch failed'));

    return {
      statusCode: isConnectionError ? 503 : 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: isConnectionError 
          ? 'Code execution service is temporarily unavailable. Please try again later.'
          : 'Failed to process code execution request',
        error: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      }),
    };
  }
};
