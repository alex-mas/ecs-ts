import { filterEntitiesByComponents, getComponents, System, World } from "../src/ecs";

const PERIODIC = 'periodic';
const createPeriodicEvent = (dt: number) => {
  return { type: PERIODIC, stopped: false, dt };
}
type PeriodicEvent = ReturnType<typeof createPeriodicEvent>;

const world = new World();

beforeEach(() => {
  world.clear();
});



test('Systems are added to the world properly when registering a chain', () => {
  const aSystem: System<PeriodicEvent, { x: number }> = (entities, event, world) => {
    const entity = entities[0];
    entity.x = 2;
  };
  const bSystem: System<PeriodicEvent, { x: number }> = (entities, event, world) => {
    const entity = entities[0];
    entity.x = 3;
  };
  world.createEventChain(PERIODIC)
    .addSystem(aSystem)
    .addSystem(bSystem)
    .register();
  expect(world.systems.length).toBe(2);
});

test('Systems get properly executed when the appropiate event is dispatched', () => {
  const system: System<PeriodicEvent, { x: number }> = (entities, event, world) => {
    const entity = entities[0];
    entity.x += 1;
  };
  const entity = {
    id: 1,
    x: 0
  };
  world.entities.push(entity);
  world.registerSystem(system, PERIODIC);
  world.dispatch(createPeriodicEvent(0));
  expect(entity.x).toBe(1);
});

test('Systems get executed respecting the priority', () => {
  const aSystem: System<PeriodicEvent, { x: number }> = (entities, event, world) => {
    const entity = entities[0];
    entity.x = 2;
  };
  const bSystem: System<PeriodicEvent, { x: number }> = (entities, event, world) => {
    const entity = entities[0];
    entity.x = 3;
  };
  const entity = {
    id: 1,
    x: 1
  };
  world.entities.push(entity);
  world.createEventChain(PERIODIC)
    .addSystem(aSystem)
    .addSystem(bSystem)
    .register();
  world.dispatch(createPeriodicEvent(0));
  expect(entity.x).toBe(3);
});

test('Systems ignore events they were not registered for', () => {
  const system: System<PeriodicEvent, { x: number }> = (entities, event, world) => {
    const entity = entities[0];
    entity.x += 1;
  };
  const entity = {
    id: 1,
    x: 0
  };
  world.entities.push(entity);
  world.registerSystem(system, PERIODIC);
  world.dispatch({ type: 'not periodic', stopped: false });
  expect(entity.x).toBe(0);
});


test('getComponents should properly return an array with the component of matching type', () => {
  const entity = {
    id: '1',
    healthComponent: {
      $$type: 'health',
      maximum: 10,
      current: 0
    }
  }
  const components = getComponents(entity, 'health');
  expect(Array.isArray(components)).toBe(true);
  expect(components.length).toBe(1);
  expect(components[0]).toBeDefined();
  expect(components[0].$$type).toBe('health');
});

test('getComponents should return an empty array if there are no matches', () => {
  const entity = {
    id: '1',
  }
  const components = getComponents(entity, 'health');
  expect(Array.isArray(components)).toBe(true);
  expect(components.length).toBe(0);
})

test('getComponents should return multiple matches properly', () => {
  const entity = {
    id: '1',
    healthComponent: {
      $$type: 'health',
      maximum: 10,
      current: 0
    },
    healthComponent2: {
      $$type: 'health',
      maximum: 10,
      current: 0
    }
  }
  const components = getComponents(entity, 'health');
  expect(Array.isArray(components)).toBe(true);
  expect(components.length).toBe(2);
  components.forEach((c) => {
    expect(c).toBeDefined();
    expect(c.$$type).toBe('health');
  });
})


test('filterEntitiesByComponents should properly filter out entities that don\'t have the specified component', () => {
  const entities = [
    {
      id: '1',
      healthComponent: {
        $$type: 'health',
        maximum: 10,
        current: 0
      }
    },
    {
      id: '2',
      physicsComponent: {
        $$type: 'physics'
      }
    },
    {
      id: '3',
      physicsComponent: {
        $$type: 'physics'
      },
      otherComponent: {
        $$type: 'other'
      }
    },
    {
      id: '4',
      otherComponent: {
        $$type: 'other'
      }
    }
  ];
  const entitiesWithHealth = filterEntitiesByComponents(entities, ['health']);
  expect(Array.isArray(entitiesWithHealth)).toBe(true);
  expect(entitiesWithHealth.length).toBe(1);
  entitiesWithHealth.forEach((c) => {
    expect(c.healthComponent).toBeDefined();
  });
  const entitiesWithPhysics = filterEntitiesByComponents(entities, ['physics']);
  expect(Array.isArray(entitiesWithPhysics)).toBe(true);
  expect(entitiesWithPhysics.length).toBe(2);
  entitiesWithPhysics.forEach((c) => {
    expect(c.physicsComponent).toBeDefined();
  });
})