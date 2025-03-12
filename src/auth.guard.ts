import {
  CanActivate,
  CustomDecorator,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  SetMetadata,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { GqlExecutionContext } from '@nestjs/graphql'
import { AuthService } from './auth.service'
import { isPublicKey } from './constants'
import { AuthContext } from './types'

const isObject = (value: unknown): value is object =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  typeof value !== 'function'

const hasRequest = <T>(obj: unknown): obj is { req: T } =>
  isObject(obj) && 'req' in obj && !!obj.req

const getRequest = <T>(context: ExecutionContext): T => {
  const ctx = GqlExecutionContext.create(context).getContext<unknown>()

  if (!hasRequest<T>(ctx)) {
    throw new InternalServerErrorException('Could not create Gql Context')
  }

  return ctx.req
}

@Injectable()
export class AuthGuard<U extends object, C extends AuthContext<U>>
  implements CanActivate
{
  constructor(
    private readonly authService: AuthService<U>,
    private readonly reflector: Reflector,
  ) {}

  canActivate = async (context: ExecutionContext): Promise<boolean> => {
    if (this.reflector.get<boolean>(isPublicKey, context.getHandler())) {
      return true
    }

    const request = getRequest<C>(context)
    const token = request.headers.authorization

    if (!token) {
      return false
    }

    if (request.user) {
      return true
    }

    request.user = await this.authService.validateToken(
      token.replace('Bearer ', ''),
    )

    return !!request.user
  }
}

export const Public = (): CustomDecorator<string> =>
  SetMetadata(isPublicKey, true)
