import { System } from "../../src/ecs";
import { ComponentType } from "../components/componentType";
import { HealthComponent } from "../components/health";
import { PeriodicEvent } from "../periodicEvent";

export const dummySystem: System<PeriodicEvent> = (event: PeriodicEvent, world) => {
  world.components.get(ComponentType.HEALTH)?.forEach((cp: HealthComponent) => {
    if (cp.current > 0) {
      console.log(cp.$$ownerId);
    }
  });
};