import { Controller, Sse, Query, BadRequestException } from '@nestjs/common'
import { Observable, of } from 'rxjs'
import { MessageEvent } from '@nestjs/common'
import { EventsService } from './events.service'
import { JwtService } from '@nestjs/jwt'

@Controller('api/events')
export class EventsController {
  constructor(private events: EventsService, private jwt: JwtService) {}

  @Sse('user')
  async streamUser(@Query('token') token?: string): Promise<Observable<MessageEvent>> {
    if (!token) {
      throw new BadRequestException('Missing token')
    }
    try {
      const payload: any = await this.jwt.verifyAsync(token)
      if (!payload?.sub) throw new Error('Invalid token')
      const userId = payload.sub
      return this.events.getUserStream(userId)
    } catch (e) {
      throw new BadRequestException('Invalid token')
    }
  }
}
