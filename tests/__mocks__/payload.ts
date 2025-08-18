// Mock Payload CMS for testing

export const getPayload = jest.fn().mockResolvedValue({
  find: jest.fn(),
  findByID: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
});

export const APIError = class extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.status = status;
    this.name = 'APIError';
  }
};

export default {
  getPayload,
  APIError,
};