import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { isObservable, lastValueFrom } from 'rxjs';
import { IS_PUBLIC_KEY } from '../../common/decorators/roles.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.isPublicRoute(context);
    const result = super.canActivate(context);
    if (!isPublic) {
      return result;
    }
    // Public routes: optional JWT — invalid/missing token must not block access
    if (typeof result === 'boolean') {
      return result;
    }
    if (isObservable(result)) {
      return lastValueFrom(result).catch(() => true);
    }
    return (result as Promise<boolean>).catch(() => true);
  }

  handleRequest<TUser>(
    err: Error | null,
    user: TUser,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    if (this.isPublicRoute(context)) {
      return (err ? null : user) as TUser;
    }
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }

  private isPublicRoute(context: ExecutionContext): boolean {
    return !!this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }
}
