const request = require("supertest");
const app = require("../../server");

describe("POST /api-v1/admin/login", () => {
  it("should login with correct credentials", async () => {
    const res = await request(app)
      .post("/api-v1/admin/login")
      .send({ mobile: "9879879870", password: "123456789" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.message).toBe("Login successful.");
  });
});