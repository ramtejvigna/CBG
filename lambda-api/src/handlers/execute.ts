const CODE_EXECUTION_URL = process.env.CODE_EXECUTION_URL || 'http://localhost:3002';

interface LambdaEvent {
  body: string | null;
  headers: { [key: string]: string | undefined };
  requestContext?: {
    identity?: { sourceIp?: string };
    requestId?: string;
  };
}

interface LambdaResult {
  statusCode: number;
  headers: { [key: string]: string };
  body: string;
}

export const handler = async (event: LambdaEvent): Promise<LambdaResult> => {
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
    
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Code execution service unavailable',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};
