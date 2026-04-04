import { describe, expect, it } from "vitest";
import { derivePlanItemPaymentPhase } from "./monthly-plan";

describe("derivePlanItemPaymentPhase", () => {
  it("returns paid when remaining is zero", () => {
    expect(derivePlanItemPaymentPhase({ paid_amount: 300, remaining_amount: 0 })).toBe("paid");
  });

  it("returns paid when remaining is negative (overpayment)", () => {
    expect(derivePlanItemPaymentPhase({ paid_amount: 400, remaining_amount: -50 })).toBe("paid");
  });

  it("returns partial when something was paid but balance remains", () => {
    expect(derivePlanItemPaymentPhase({ paid_amount: 300, remaining_amount: 300 })).toBe("partial");
  });

  it("returns pending when nothing was paid and balance remains", () => {
    expect(derivePlanItemPaymentPhase({ paid_amount: 0, remaining_amount: 600 })).toBe("pending");
  });
});
