// Mock Next.js server for testing

export class NextRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  body?: any;

  constructor(url: string, init?: RequestInit & { cookies?: Record<string, string> }) {
    this.url = url;
    this.method = init?.method || 'GET';
    this.headers = {};
    this.cookies = init?.cookies || {};
    this.body = init?.body;
  }

  async json() {
    return this.body ? JSON.parse(this.body) : {};
  }

  async text() {
    return this.body || '';
  }
}

export class NextResponse {
  static json(data: any, init?: ResponseInit) {
    const response = {
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: init?.headers || {},
    };
    return response;
  }

  static redirect(url: string, status: number = 302) {
    return {
      status,
      headers: { Location: url },
    };
  }
}

export default {
  NextRequest,
  NextResponse,
};