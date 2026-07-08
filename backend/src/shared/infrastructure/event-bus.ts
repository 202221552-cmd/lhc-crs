import EventEmitter from 'events';
import { logger } from '../logger.js';

export interface DomainEvent {
  eventName: string;
  aggregateId: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
}

type EventHandler = (event: DomainEvent) => void | Promise<void>;

class EventBus extends EventEmitter {
  private handlers = new Map<string, Set<EventHandler>>();

  publish(event: DomainEvent) {
    const handlers = this.handlers.get(event.eventName);
    if (!handlers?.size) return;

    logger.debug({ event: event.eventName, aggregateId: event.aggregateId }, 'Publishing event');

    for (const handler of handlers) {
      try {
        const result = handler(event);
        if (result instanceof Promise) {
          result.catch((err) => {
            logger.error({ err, event: event.eventName }, 'Event handler failed');
          });
        }
      } catch (err) {
        logger.error({ err, event: event.eventName }, 'Event handler threw');
      }
    }
  }

  subscribe(eventName: string, handler: EventHandler) {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    this.handlers.get(eventName)!.add(handler);

    return () => {
      this.handlers.get(eventName)?.delete(handler);
    };
  }

  // Clear all handlers for testing
  clear() {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();

// Predefined events
export const Events = {
  STUDENT_ENROLLED: 'student.enrolled',
  STUDENT_WITHDRAWN: 'student.withdrawn',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_VOIDED: 'payment.voided',
  CERTIFICATE_ISSUED: 'certificate.issued',
  INSTALLMENT_CREATED: 'installment.created',
  INSTALLMENT_UPDATED: 'installment.updated',
} as const;

export function createEvent(
  eventName: string,
  aggregateId: string,
  payload: Record<string, unknown>,
): DomainEvent {
  return { eventName, aggregateId, occurredAt: new Date(), payload };
}
