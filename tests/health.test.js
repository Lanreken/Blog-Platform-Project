const request = require("supertest");
const app = require("../app");

describe("Health check", () => {
  it("should return ok status", async () => {
    const response = await request(app).get("/api/v1/health").expect(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.environment).toBeDefined();
  });
});
