// Test environment setup
process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "test";

// Mock the TypeORM DataSource so the controllers/services never touch a real DB.
// Individual tests override getRepository / transaction with their own stubs.
jest.mock("../src/config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    transaction: jest.fn(),
    getMetadata: jest.fn(() => ({
      findColumnWithPropertyName: jest.fn(() => undefined),
    })),
    initialize: jest.fn().mockResolvedValue(true),
    destroy: jest.fn().mockResolvedValue(true),
    isInitialized: true,
  },
}));
