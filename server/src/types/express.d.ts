import 'express';

export interface AuthPayload {
  userId: number;
  role: 'admin' | 'trainee';
  username: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthPayload;
  }
}
