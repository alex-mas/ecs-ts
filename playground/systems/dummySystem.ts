import { System } from "../../src/ecs";
import { ComponentType } from "../components/componentType";
import { WorldType } from "../main";
import { PeriodicEvent } from "../periodicEvent";

export const dummySystem: System<PeriodicEvent, WorldType> = (event: PeriodicEvent, world) => {
  world.components.get(ComponentType.HEALTH)?.forEach((cps) => {
    cps.forEach((cp) => {
      if (cp.current > 0) {
        console.log(cp.$$entityId);
      }
    })
  });
};