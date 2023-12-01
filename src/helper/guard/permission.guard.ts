import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MeService } from 'src/api/me/me.service';
import { message } from 'src/constant/message';
import { Permission } from 'src/enum/permission.enum';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private meServices: MeService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const requiredRoles = this.reflector.getAllAndOverride<Permission[]>(
        'permission',
        [context.getHandler(), context.getClass()],
      );
      if (!requiredRoles) {
        return true;
      }
      const { user } = context.switchToHttp().getRequest();
      const { data } = await this.meServices.me(user);

      // super admin can access all modules
      if (data.role_name == 'super admin') {
        return true;
      }

      const module = data?.module_permission?.find(
        (module) => module.module_name === requiredRoles[0],
      );

      const permission = module?.permission_name?.some(
        (ele) => ele === requiredRoles[1],
      );
      if (permission) {
        return true;
      }

      throw new ForbiddenException(message.FORBIDDEN);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
}
