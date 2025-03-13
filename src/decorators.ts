import {
  CustomDecorator,
  ExecutionContext,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { isPublicKey } from './constants'
import { AuthContext } from './types'

export const GetUser = createParamDecorator(
  <U extends object>(_: any, context: ExecutionContext) =>
    GqlExecutionContext.create(context).getContext<{
      req: AuthContext<U>
    }>().req.user,
)

export const Public = (): CustomDecorator<string> =>
  SetMetadata(isPublicKey, true)
