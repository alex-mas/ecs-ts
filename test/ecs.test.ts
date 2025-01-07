import { getComponents, getEntity, queryEntities, regularSystem, System, World } from "../src/ecs";

const PERIODIC = 'periodic';

const createPeriodicEvent = (dt: number) => {
  return { type: PERIODIC, stopped: false, dt };
}
type PeriodicEvent = ReturnType<typeof createPeriodicEvent>;
const NON_PERIODIC = 'non_periodic';
const createNonPeriodicEvent = (dt: number) => {
  return { type:  NON_PERIODIC, stopped: false, dt };
}
type NonPeriodicEvent = ReturnType<typeof createNonPeriodicEvent>;

let world = new World<string, number>();

const positionArchetype = ['position'];
const healthArchetype = ['health'];
const unitArchetype = ['health', 'position'];
beforeEach(() => {
  world = new World<string, number>();
  world.registerComponentType('position');
  world.registerComponentType('health');
  world.registerArchetype(positionArchetype);
  world.registerArchetype(healthArchetype);
  world.registerArchetype(unitArchetype);
});


const dataInit = () => {
  const entity = [{
    $$type: 'position',
    $$entityId: 1,
    x: 1
  }, {
    $$type: 'health',
    $$entityId: 1,
    x: 1
  }];

  const entity2 = [{
    $$type: 'position',
    $$entityId: 2,
    x: 2
  }, {
    $$type: 'health',
    $$entityId: 2,
    x: 2
  }];

  const entity3 = [{
    $$type: 'position',
    $$entityId: 3,
    x: 3
  }];

  world.addEntity(1, entity, unitArchetype);
  world.addEntity(2, entity2, unitArchetype);
  world.addEntity(2, entity3, positionArchetype);

}



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
    .addSystem(aSystem)
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

test('getComponents returns the specified component from the entity', async () => {

  dataInit();

  const position1 = getComponents(1, 'position', world.components);
  expect(position1).toBeDefined();
  expect(position1?.length).toBe(1);
  if (position1) {
    expect(position1[0].x).toBe(1);
  }
});


test('getEntity fetches all components owned by it', async () => {

  dataInit();

  const entity = getEntity(1, world);
  expect(entity.$$id).toBe(1);
  expect(entity.health).toBeDefined();
  expect(entity.position).toBeDefined();
});


test('queryEntities filters entities properly', async () => {

  dataInit();

  const positionQuery = queryEntities(['position'], world);
  const healthQuery = queryEntities(['health'], world);

  expect(positionQuery.length).toBe(3);
  expect(healthQuery.length).toBe(2);
});


test('queryActhetype filters entities properly', async () => {

  dataInit();

  const positionQuery = queryEntities(positionArchetype, world);
  const healthQuery = queryEntities(healthArchetype, world);

  expect(positionQuery.length).toBe(3);
  expect(healthQuery.length).toBe(2);
});




test('regular system gives the appropiate entities', async () => {

  dataInit();

  world.createEventChain(PERIODIC)
    .addSystem(regularSystem((e, entities, world) => {
      expect(entities.length).toBe(3);
    }, positionArchetype));

  await world.dispatch(createPeriodicEvent(1000));
});


test('systems execute without hanging', async () => {

  dataInit();

  const createSys = ()=>regularSystem((e, entities, world) => {
    expect(entities.length).toBe(3);
  }, positionArchetype) as any;

 
  world.createEventChain(PERIODIC)
    .addSystem(createSys())
    .addSystem(createSys()).register().createEventChain(NON_PERIODIC).addSystem(createSys()).register();

  await world.dispatch(createPeriodicEvent(1000));

  expect(true).toBe(true);
});