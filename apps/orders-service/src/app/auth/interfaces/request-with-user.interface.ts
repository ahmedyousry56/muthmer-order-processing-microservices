import { Request } from 'express';
import { customers } from '@prisma/client';

export interface RequestWithUser extends Request {
  user: customers;
}
