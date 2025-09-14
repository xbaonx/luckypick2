import { Injectable } from '@nestjs/common'
import { MessageEvent } from '@nestjs/common'
import { Observable, Subject } from 'rxjs'

@Injectable()
export class EventsService {
  private streams = new Map<string, Subject<MessageEvent>>()

  getUserStream(userId: string): Observable<MessageEvent> {
    let subject = this.streams.get(userId)
    if (!subject) {
      subject = new Subject<MessageEvent>()
      this.streams.set(userId, subject)
    }
    return subject.asObservable()
  }

  emitToUser(userId: string, event: string, data: any) {
    const subject = this.streams.get(userId)
    if (!subject) return
    subject.next({ type: event, data })
  }
}
