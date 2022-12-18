import { getComponents, System, World } from "../src/ecs";

const PERIODIC = 'periodic';
const createPeriodicEvent = (dt: number) => {
  return { type: PERIODIC, stopped: false, dt };
}
type PeriodicEvent = ReturnType<typeof createPeriodicEvent>;

let world = new World<string, number>();

const positionArchetype = ['position'];
beforeEach(() => {
  world = new World<string, number>();
  world.registerComponentType('position');
  world.registerArchetype(positionArchetype)
});



test('Systems are added to the world properly when registering a chain', () => {
  const aSystem: System<PeriodicEvent, World<string, number>> = (event, world) => {
    const [position] = getComponents(1, 'position', world.components) as unknown as any;
    if(position){
      position.x = 2;
    }
  };
  const bSystem: System<PeriodicEvent, World<string, number>> = (event, world) => {
    const [position] = getComponents(1, 'position', world.components) as unknown as any;
    if(position){
      position.x = 3;
    }
  };
  world.createEventChain(PERIODIC)
    .addSystem(aSystem, [])
    .addSystem(bSystem, [aSystem])
    .register();
  expect(world.systems.get(PERIODIC)?.length ).toBe(2);
});


test('Systems get properly executed when the appropiate event is dispatched', async () => {
  const system: System<PeriodicEvent, typeof world> = (event, world) => {
    const [position] = getComponents(1, 'position', world.components) as unknown as any;
    if(position){
      position.x += 1;
    }
  };
  const positionCp = {
    $$type: 'position',
    $$entityId: 1,
    x: 0
  };
  world.addEntity(1, [positionCp], positionArchetype);
  await world.createEventChain(PERIODIC)
    .addSystem(system, [])
    .register()
    .dispatch(createPeriodicEvent(0));
  expect(positionCp.x).toBe(1);
});

test('Systems get executed respecting the priority', async () => {
  const aSystem: System<PeriodicEvent, World<string, number>> = (event, world) => {
    const [position] = getComponents(1, 'position', world.components) as unknown as any;
    if (position) {
      position.x = 2;
    }
  };
  const bSystem: System<PeriodicEvent, World<string, number>> = (event, world) => {
    const [position] = getComponents(1, 'position', world.components) as unknown as any;
    if (position) {
      position.x = 3;
    }
  };
  const positionCp = {
      $$type: 'position',
      $$entityId: 1,
      x: 0
    };
  world.addEntity(1, [positionCp], positionArchetype);
  await world.createEventChain(PERIODIC)
    .addSystem(aSystem)
    .addSystem(bSystem)
    .register()
    .dispatch(createPeriodicEvent(0));
  expect(positionCp.x).toBe(3);
});

test('Systems ignore events they were not registered for', async () => {
  const system: System<PeriodicEvent, World<string, number>> = (event, world) => {
    const [position] = getComponents(1, 'position', world.components) as any;
    if(position){
      position.x = 2;
    }
  };
  const positionCp = {
    $$type: 'position',
    $$entityId: 1,
    x: 0
  };
  world.addEntity(1, [positionCp], positionArchetype);
  await world.createEventChain(PERIODIC)
    .addSystem(system)
    .register()
    .dispatch({ type: 'not periodic'});
  expect(positionCp.x).toBe(0);
});