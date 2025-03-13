import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
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
    const isPublic = this.reflector.get<boolean>(
      isPublicKey,
      context.getHandler(),
    )
    const request = getRequest<C>(context)
    const token = request.headers.authorization

    if (token && !request.user) {
      request.user = await this.authService.validateToken(
        token.replace('Bearer ', ''),
      )
    }

    if (isPublic) {
      return true
    }

    return !!request.user
  }
}
