import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

export const validate = (schema: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Map zod errors to a readable string or object
        const zodError = error as any;
        const errorMessage = zodError.errors ? zodError.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') : 'Validation failed';
        return next(new ApiError(400, `Validation Error: ${errorMessage}`));
      }
      return next(error);
    }
  };
};
