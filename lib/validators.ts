import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  kind: z.enum(["fixed", "variable"]).default("variable"),
});

export const householdSchema = z.object({
  partner_email: z.string().trim().email().optional().or(z.literal("")),
});

export const monthlyBudgetSchema = z.object({
  category_id: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(3000),
  expected_amount: z.number().min(0),
  is_fixed: z.boolean().default(false),
});

export const monthlyBudgetExportSchema = z.object({
  source_month: z.number().int().min(1).max(12),
  source_year: z.number().int().min(2000).max(3000),
  target_month: z.number().int().min(1).max(12),
  target_year: z.number().int().min(2000).max(3000),
  only_fixed: z.boolean().default(true),
});

export const transactionSchema = z.object({
  category_id: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().max(255).optional(),
  transaction_date: z.string(),
});

export const monthlyPlanRequestSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(3000),
  partner_email: z.string().trim().email().optional().or(z.literal("")),
});

export const monthlyPlanItemSchema = z.object({
  monthly_plan_id: z.string().uuid(),
  category_id: z.string().uuid(),
  title: z.string().trim().min(2).max(120),
  section: z.enum(["general", "investments", "emergency_reserve", "debts"]),
  expected_amount: z.number().positive(),
  is_fixed: z.boolean().default(false),
  due_date: z.string().min(1),
  assigned_user_id: z.string().uuid(),
  notes: z.string().trim().max(255).nullable().optional(),
});

export const monthlyPlanItemUpdateSchema = monthlyPlanItemSchema
  .omit({ monthly_plan_id: true })
  .partial()
  .extend({
    status: z.enum(["pending", "partial", "paid"]).optional(),
    paid_by_user_id: z.string().uuid().nullable().optional(),
    paid_at: z.string().nullable().optional(),
  });

export const monthlyPlanExportSchema = z.object({
  source_month: z.number().int().min(1).max(12),
  source_year: z.number().int().min(2000).max(3000),
  target_month: z.number().int().min(1).max(12),
  target_year: z.number().int().min(2000).max(3000),
});

