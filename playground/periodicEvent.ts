import { Event } from '../src/ecs';

export type PeriodicEvent = Event<{ dt: number }>;