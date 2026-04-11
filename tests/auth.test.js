const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app");
const User = require("../models/user");

jest.setTimeout(30000);


let mongoServer;
let usingMemoryDB = false;

beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create({ instance: { dbName: "jest" } });
    process.env.MONGO_URI = mongoServer.getUri();
    usingMemoryDB = true;
  } catch (error) {
    process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/blog_platform_test";
  }

  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  if (usingMemoryDB && mongoServer) {
    await mongoServer.stop();
  }
});

describe("Authentication and email verification flow", () => {
  it("should register a user, verify email, login, and refresh token", async () => {
    const registerResponse = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "Password1",
      })
      .expect(201);

    expect(registerResponse.body.message).toMatch(/check your email/i);
    expect(registerResponse.body.user.email).toBe("test@example.com");
    expect(registerResponse.body.user.isEmailVerified).toBe(false);

    const loginResponse = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com", password: "Password1" })
      .expect(403);

    expect(loginResponse.body.message).toMatch(/email must be verified/i);

    const user = await User.findOne({ email: "test@example.com" }).select("emailVerificationToken");
    expect(user).toBeTruthy();

    const verifyResponse = await request(app)
      .get(`/api/v1/auth/verify-email/${user.emailVerificationToken}`)
      .expect(200);

    expect(verifyResponse.body.message).toMatch(/email verified/i);

    const loginAfterVerify = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com", password: "Password1" })
      .expect(200);

    expect(loginAfterVerify.body.token).toBeDefined();
    expect(loginAfterVerify.body.refreshToken).toBeDefined();

    const refreshResponse = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: loginAfterVerify.body.refreshToken })
      .expect(200);

    expect(refreshResponse.body.token).toBeDefined();
    expect(refreshResponse.body.refreshToken).toBeDefined();
  });
});
