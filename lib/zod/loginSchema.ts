import { z } from "zod";

export const loginSchema = z.object({
  //zod schema for email
  email: z.email({ pattern: z.regexes.html5Email }),
  password: z.string().min(6),
});

export type LoginInput = z.infer<typeof loginSchema>;
