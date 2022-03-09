import { createDummy } from './entities/dummy';
import { ComponentType } from './components/componentType';
import { EventType } from './eventType';
import { dummySystem } from './systems/dummySystem';
import { World } from '../src/ecs';

const world: World = new World();

world.entities.push(createDummy('1', 50, 10));
world.entities.push(createDummy('2', 50, 10));

world.registerSystem(dummySystem, EventType.PERIODIC);

world.dispatch({ type: EventType.PERIODIC, dt: 1000 / 60, stopped: false});

world
    .createEventChain(EventType.PERIODIC)
    .addSystem(dummySystem)
    .addSystem(dummySystem)
    .register();
