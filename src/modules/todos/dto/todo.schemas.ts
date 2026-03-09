import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const TodoStatusSchema = z.enum(['open', 'done']);

export const CreateTodoSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
});

export const UpdateTodoSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  status: TodoStatusSchema.optional(),
});

// DTO classes — used for validation + Swagger docs, no duplication
export class CreateTodoDto extends createZodDto(CreateTodoSchema) {}
export class UpdateTodoDto extends createZodDto(UpdateTodoSchema) {}

// raw types still available if needed
export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;
export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>;
