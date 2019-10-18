import { ComponentType } from "./componentType"
import {Component} from '../../../src/ecs';
import { EventType } from "../eventType";

export interface HealthComponentData {
    maximum: number,
    current: number
}
export type HealthComponent = Component<ComponentType,ComponentType.HEALTH, HealthComponentData>;

export const createHealthComponent = (initial: number, maximum: number)=>{
    return {
        $$type: ComponentType.HEALTH,
        current: initial,
        maximum
    }
}