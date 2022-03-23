import { regularSystem, Entity, filterEntitiesByComponents, World } from "../../src/ecs";
import { ComponentType } from "../components/componentType";
import { EventType } from "../eventType";
import { PeriodicEvent } from "../periodicEvent";

export const dummySystem = regularSystem((entities, event: PeriodicEvent, world) => {
    entities.forEach((entity) => {
        if (!entity.health.isAlive) { return; }
        let target: Entity| undefined;
        if (true) {
            target = world.entities.find((e) => e.id === "s");
        }
    });
}, [ComponentType.ATTACK, ComponentType.HEALTH] as const)