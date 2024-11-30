import { z } from 'zod';

const BaseCheckSchema = z.object({
  name: z.string().trim().min(1),
  host: z.string().trim().min(1),
});

const HttpCheckSchema = BaseCheckSchema.extend({
  type: z.literal('http'),
  method: z.string().optional(),
  data: z.object({}).passthrough().optional(),
  headers: z.object({}).catchall(z.any()).optional(),
  expectedCode: z.number().int().min(100).max(599).optional(),
  expectedResponse: z
    .union([z.string(), z.object({}).catchall(z.any())])
    .optional(),
});

const ServiceSchema = z.object({
  title: z.string().trim().min(1),
  baseUrl: z.string().url().optional(),
  baseHeaders: z.object({}).catchall(z.any()).optional(),
  checks: z.array(z.discriminatedUnion('type', [HttpCheckSchema])),
});

export const SourceFileSchema = z.union([
  ServiceSchema,
  z.array(ServiceSchema),
]);
