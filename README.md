# @hatkom/aws-auth-guard

A NestJS module that integrates AWS Cognito JWT authentication into GraphQL applications. It validates Bearer tokens from incoming requests against a Cognito User Pool, resolves the authenticated user via a configurable lookup function, and applies a global guard that blocks unauthenticated access by default.

## Features

- Global `AuthGuard` applied automatically to all GraphQL resolvers
- AWS Cognito JWT verification via [`aws-jwt-verify`](https://github.com/awslabs/aws-jwt-verify)
- `@Public()` decorator to opt out of authentication on specific resolvers
- `@GetUser()` param decorator to inject the authenticated user into a resolver
- Generic user type — bring your own `User` model

## Installation

```bash
npm install @hatkom/aws-auth-guard
```

### Peer dependencies

```bash
npm install @nestjs/common @nestjs/core @nestjs/graphql aws-jwt-verify
```

## Usage

### 1. Register the module

```ts
import { AuthModule } from '@hatkom/aws-auth-guard'
import { UserService } from './user/user.service'

@Module({
  imports: [
    AuthModule.forRootAsync<User, AppContext>({
      imports: [UserModule],
      inject: [UserService],
      useFactory: (userService: UserService) => ({
        credentials: {
          userPoolId: process.env.COGNITO_USER_POOL_ID,
          userPoolClientAppId: process.env.COGNITO_CLIENT_ID,
        },
        findUser: ({ cognitoId }) => userService.findByCognitoId(cognitoId),
      }),
    }),
  ],
})
export class AppModule {}
```

### 2. Use the decorators

```ts
import { GetUser, Public } from '@hatkom/aws-auth-guard'
import { Query, Resolver } from '@nestjs/graphql'

@Resolver()
export class ProfileResolver {
  // Protected by default — requires a valid Cognito token
  @Query(() => User)
  me(@GetUser() user: User) {
    return user
  }

  // Opt out of authentication for this resolver
  @Public()
  @Query(() => String)
  hello() {
    return 'world'
  }
}
```

### 3. Configure the GraphQL context

Pass the request object through the GraphQL context so the guard can access headers and attach the resolved user:

```ts
GraphQLModule.forRoot({
  context: ({ req }) => ({ req }),
})
```

## API

### `AuthModule.forRootAsync(options)`

| Option       | Type                                                | Description                                                      |
| ------------ | --------------------------------------------------- | ---------------------------------------------------------------- |
| `useFactory` | `(...args) => AuthOptions \| Promise<AuthOptions>`  | Factory returning Cognito credentials and user lookup function   |
| `inject`     | `any[]`                                             | Providers to inject into the factory                             |
| `imports`    | `any[]` _(optional)_                                | Modules to import for the factory's dependencies                 |

### `AuthOptions<U>`

| Field                              | Type                                              | Description                                             |
| ---------------------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| `credentials.userPoolId`           | `string`                                          | AWS Cognito User Pool ID                                |
| `credentials.userPoolClientAppId`  | `string`                                          | AWS Cognito App Client ID                               |
| `findUser`                         | `(params: { cognitoId: string }) => Promise<U \| null>` | Resolves a user from the verified token's `sub` claim |

### Decorators

| Decorator    | Usage                          | Description                                              |
| ------------ | ------------------------------ | -------------------------------------------------------- |
| `@Public()`  | Method decorator on a resolver | Skips authentication for that resolver                   |
| `@GetUser()` | Param decorator                | Injects the authenticated user from the GraphQL context  |

## License

MIT
