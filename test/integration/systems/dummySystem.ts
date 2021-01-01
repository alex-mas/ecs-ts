import { regularSystem, Entity, filterEntitiesByComponents, World } from "../../../src/ecs";
import { ComponentType } from "../components/componentType";
import { EventType } from "../eventType";

export const dummySystem = regularSystem((entities, event, world) => {
    entities.forEach((entity) => {
        if (!entity.health.isAlive) { return; }
        const healthEntities = filterEntitiesByComponents(world.entities, [ComponentType.HEALTH]);
        let target: Entity<ComponentType.HEALTH> | undefined;
        if (true) {
            target = world.entities.find((e) => e.id === "s");
        }

    });
}, [ComponentType.ATTACK, ComponentType.HEALTH])