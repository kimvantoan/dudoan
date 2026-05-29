import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context) {
    // If user is validated, return it. Otherwise, return null (do not throw UnauthorizedException).
    return user || null;
  }
}
