import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
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

