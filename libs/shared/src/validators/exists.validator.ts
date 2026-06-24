import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
  isUUID,
} from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

type DynamicClient = Record<string, any>;

@Injectable()
@ValidatorConstraint({
  name: 'Exists',
  async: true,
})
export class ExistsConstraint implements ValidatorConstraintInterface {
  constructor(private readonly PrismaService: PrismaService) {}

  async validate(value: unknown, args: ValidationArguments): Promise<boolean> {
    if (!value || typeof value !== 'string') return true;
    if (!isUUID(value)) return true;

    const model = args.constraints[0] as string;
    const delegate = (this.PrismaService as unknown as DynamicClient)[model];
    if (!delegate) return false;

    const row = await delegate.findFirst({
      where: {
        id: value,
        deleted_at: null,
      },
      select: { id: true },
    });

    return !!row;
  }

  defaultMessage(args: ValidationArguments): string {
    const model = args.constraints[0] as string;
    return `${model} with id '${args.value}' does not exist`;
  }
}

/**
 * Validates that a UUID exists in the given Prisma model (soft-delete aware).
 *
 * @example
 * ```ts
 * @IsExists('items')
 * item_id?: string;
 * ```
 */
export function IsExists(model: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [model],
      validator: ExistsConstraint,
    });
  };
}
