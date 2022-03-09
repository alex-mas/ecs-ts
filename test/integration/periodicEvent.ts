import {Event} from '../../src/ecs';
import { EventType } from './eventType';

export type PeriodicEvent =Event<{dt: number}>;