import { World } from '../src/ecs';
import { AttackComponent } from './components/attack';
import { ComponentType } from './components/componentType';
import { HealthComponent } from './components/health';
import { createDummy, DummyArchetype } from './entities/dummy';
import { EventType } from './eventType';
import { dummySystem } from './systems/dummySystem';

type TypeMap = {
  [ComponentType.ATTACK]: AttackComponent;
  [ComponentType.HEALTH]: HealthComponent;
  [ComponentType.UNUSED]: undefined;
}
const world = new World<ComponentType, string,TypeMap>();

export type WorldType = World<ComponentType, string,TypeMap>;

world.registerArchetype(DummyArchetype);

const entity1Id = '1';
const entity2Id = '2';
const entity1 = createDummy(entity1Id, 50, 10);
const entity2 = createDummy(entity2Id, 50, 10);

world.addEntity(entity1Id, entity1, DummyArchetype);
world.addEntity(entity2Id, entity2, DummyArchetype);

world.createEventChain(EventType.PERIODIC).addSystem(dummySystem).register();


world.dispatch({ type: EventType.PERIODIC, dt: 1000 / 60, stopped: false });