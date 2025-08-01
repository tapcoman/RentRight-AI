import { User } from '../shared/schema';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      signedUrlToken?: string;
      clientIp?: string;
    }
  }
}