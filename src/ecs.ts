import { addNode, DirectedGraph, DirectedGraphNode } from "./graph";


const mapSystemsToNodes = <T, WorldType extends World<any, any>>(systems: System<T, WorldType>[], graph: DirectedGraph<RegisteredSystem<T, WorldType>>) => {
  return systems.map((s) => graph.findIndex((v) => v.value.execute === s))
}

export type Component<Payload extends object = {}, EntityIdType extends (string | number) = string, CpType extends (string | number) = string> = 
  Payload & {
    $$type: CpType,
    $$entityId: EntityIdType
  }

export type Event<Payload extends object = any> = Payload & {
  type: string,
}
export type System<Ev extends Event, T extends World<any, any> = World> = (event: Ev, world: T) => void

export type RegisteredSystem<Ev extends Event = Event<any>, WorldType extends World<any, any> = World> = {
  execute: System<Ev, WorldType>
}

export type SystemRunner<CpType extends (string | number) = string, EId extends (string | number) = string> = <T>(system: DirectedGraph<RegisteredSystem<T, World<CpType, EId>>>, event: T, world: World<CpType, EId>) => Promise<number>;

export const defaultSystemRunner: SystemRunner =
  async (systems, event, world) => {
    const executed: DirectedGraphNode<RegisteredSystem<typeof event, typeof world>>[] = [];
    let available = systems.filter((v) => {
      return v.parents.length === 0;
    });
    while (executed.length < systems.length) {
      if (available.length > 0) {
        const executing = available;
        available = [];
        const completed = await Promise.race(executing.map(async (s) => {
          try {
            const res = s.value.execute(event, world);
            executed.push(s);
            s.children.forEach((child) => {
              const childNode = systems[child];
              if (!childNode) {
                throw new Error(`System ${s.value.execute.name} child system ${child} not found`);
              }
              available.push(childNode);
            });
            return res;
          } catch (e) {
            throw e;
          }
        }));
      } else {
        continue;
      }
    }
    return 0;
  }

export class World<CpType extends (string | number) = string, EId extends (string | number) = string>{
  runner: SystemRunner<CpType, EId>;
  components: Map<CpType, Map<EId, Component<any, EId, CpType>[]>> = new Map();
  systems: Map<string, DirectedGraph<RegisteredSystem<any, World<CpType, EId>>>> = new Map();
  entityMap: Map<EId, CpType[]> = new Map();
  archetypeMap: Map<CpType[], EId[]> = new Map();
  constructor(runner: SystemRunner<CpType, EId> = defaultSystemRunner) {
    this.runner = runner;
  }

  registerArchetype(componenTypes: CpType[]) {
    this.archetypeMap.set(componenTypes, []);
  }

  registerArchetypes(archetypes: CpType[][]) {
    archetypes.forEach((archetype) => {
      this.registerArchetype(archetype);
    })
  }

  registerComponentTypes(componenType: CpType[]) {
    componenType.forEach((cType) => {
      this.registerComponentType(cType);
    })
  }

  registerComponentType(componenType: CpType) {
    this.components.set(componenType, new Map());
    return this;
  }
  /**
   * Expects the components Map to be initialized for the given component type, and the entity to exist
   * otherwise this method will throw when trying to get the existing components of the owner entity
   */
  addComponent<CpPayload extends {}>(component: Component<CpPayload, EId, CpType>) {
    const ownerId = component.$$entityId;

    //get and remove previous archetype from entity
    let previousArchetype = this.entityMap.get(ownerId) as CpType[] || [];
    if (previousArchetype.length > 0) {
      const previousArchetypeEntities = this.archetypeMap.get(previousArchetype) as EId[];
      previousArchetypeEntities.splice(previousArchetypeEntities.indexOf(ownerId), 1);
    }
    //find and set new archetype
    if (!previousArchetype.includes(component.$$type)) {
      for (let [archetype, v] of this.archetypeMap) {
        if (archetype.length === previousArchetype.length + 1 && archetype.every((v) => {
          return v === component.$$type || previousArchetype.includes(v);
        })) {
          v.push(ownerId);
          this.entityMap.set(ownerId, archetype);
          break;
        }
      }
    }

    //@ts-ignore -> cpMap is  expected to be defined, otherwise we will fail and throw, this way we don't waste time checking
    const cpMap: Map<EId, Component<CpPayload, EId, CpType>[]> = this.components.get(component.$$type);

    const cp = cpMap.get(ownerId);
    if (cp) {
      cp.push(component);
    } else {
      cpMap.set(ownerId, [component]);
    }
    return this;
  }

  /**
 * Expects the components Map to be initialized for the given component types
 * 
 */
  addEntity<CpPayload extends {}>(entityId: EId, components: Component<CpPayload, EId, CpType>[], archetype: CpType[]) {
    const cpTypes = new Map<CpType, boolean>();
    components.forEach((cp) => {
      cpTypes.set(cp.$$type, true);
      //@ts-ignore -> cpMap is  expected to be defined, otherwise we will fail and throw, this way we don't waste time checking
      const cpMap: Map<EId, Component<CpPayload, EId, CpType>[]> = this.components.get(cp.$$type);
      const cpArr = cpMap.get(entityId);
      if (cpArr) {
        cpArr.push(cp);
      } else {
        cpMap.set(entityId, [cp]);
      }
    });
    const savedArchetype = this.archetypeMap.get(archetype);
    if (!savedArchetype) {
      this.archetypeMap.set(archetype, [entityId]);
    } else {
      savedArchetype.push(entityId);
    }
    this.entityMap.set(entityId, archetype);
  }

  removeComponent<CpPayload extends {}>(component: Component<CpPayload, EId, CpType>) {
    const owner = component.$$entityId;
    const entityComponents = this.entityMap.get(owner);
    //@ts-ignore
    entityComponents.set(component.$$type, entityComponents.get(component.$$type) - 1);

    //remove entitiy from archetype
    const archetype = this.entityMap.get(owner) as CpType[];
    const archetypeEntities = this.archetypeMap.get(archetype) as EId[];
    archetypeEntities.splice(archetypeEntities.indexOf(owner), 1);
    //add it to new archetype
    const newArchetype = archetype.filter((v) => v !== component.$$type);
    this.archetypeMap.forEach((entities, aType) => {
      if (newArchetype.every((v) => aType.includes(v))) {
        entities.push(owner);
      }
    })
  }


  removeEntity(entityId: EId) {
    const cpTypes: Map<CpType, number> = this.entityMap.get(entityId) as unknown as Map<CpType, number>;
    this.entityMap.delete(entityId);
    cpTypes.forEach((_, type) => {
      //@ts-ignore
      this.components.get(type).delete()
    })
  }

  createEventChain(event: string) {
    const systemsGraph: DirectedGraph<RegisteredSystem<any, World<CpType, EId>>> = [];
    const chainCreator = {
      addSystem: function <Ev extends Event>(sys: System<Ev, World<CpType, EId>>, dependsOn: System<Ev, World<CpType, EId>>[] = []) {
        addNode({
          execute: sys
        }, mapSystemsToNodes(dependsOn, systemsGraph), systemsGraph);
        return this as typeof chainCreator;
      },
      addSystems: function <Ev extends Event>(sys: System<Ev, World<CpType, EId>>[], dependsOn: System<Ev, World<CpType, EId>>[] = []) {
        sys.forEach((s) => {
          addNode({
            execute: s
          }, mapSystemsToNodes(dependsOn, systemsGraph), systemsGraph);
        })
        return this as typeof chainCreator;
      },
      register: (): World<CpType, EId> => {
        const existingSystems =this.systems.get(event);
        if(!existingSystems){
          this.systems.set(event, systemsGraph);
        }else{
          throw new Error('Registering multiple execution graphs to to same event is not suported yet');
        }
        return this;
      }
    };
    return chainCreator;
  }
  async dispatch<Ev extends Event<{}>>(event: Ev) {
    const relevantSystems = this.systems.get(event.type);
    if (!relevantSystems) { return; }
    await this.runner(relevantSystems, event, this);
    return this;
  }
}  

export const getComponents =
  <
    CpId extends (string | number) = string,
    EId extends (string | number) = string
  >
    (entityId: EId, componentType: CpId, cpMap: World<CpId, EId>['components']) => {
  //@ts-ignore - we expect cp to be there
  return cpMap.get(componentType).get(entityId);
}


type ConstructedEntity<CpId extends (string | number), EId extends (string | number)> = { $$id: EId } & { [x in CpId]?: Component<any, EId, CpId>[] };

export const getEntity = <CpId extends (string | number), EId extends (string | number)>(entityId: EId, cpMap: World<CpId, EId>['components'], components?: CpId[]) => {
  const entity: any = {
    $$id: entityId
  }
  if (components) {
    components.forEach((cp) => {
    //@ts-ignore - we expect cp to be there
      entity[cp] = cpMap.get(cp).get(entityId);
    });
  } else {
    cpMap.forEach((val, key) => {
      entity[key] = val.get(entityId);
    });
  }
  return entity as ConstructedEntity<CpId, EId>
}


export type QueryEntitiesFilter<CpId extends (string | number), EId extends (string | number)> =
  (components: CpId[], world: World<CpId, EId>, getOtherComponents?: boolean) => ConstructedEntity<CpId, EId>

export const queryEntities = <CpId extends (string | number), EId extends (string | number)>(components: CpId[], world: World<CpId, EId>) => {
  let entityIds: EId[] = [];
  world.archetypeMap.forEach((entities, archetype) => {
    if (archetype === components || components.every((cpType) => archetype.includes(cpType))) {
      entityIds = entityIds.concat(entities);
    }
  })
  let entities = Array(entityIds.length);
  entityIds.forEach((eid) => {
    return getEntity(eid, world.components);
  })
  return entities;
}

export const queryArchetype = <CpId extends (string | number), EId extends (string | number)>(archetype: CpId[], world: World<CpId, EId>) => {
  let entityIds: EId[] = [];
  world.archetypeMap.forEach((entities, aType) => {
    if (aType === archetype || archetype.every((cpType) => aType.includes(cpType))) {
      entityIds = entityIds.concat(entities);
    }
  })
  return entityIds.map((eid) => {
    return getEntity(eid, world.components, archetype);
  });
}

export type RegularSystem<T extends Event, CpId extends (string | number), EId extends (string | number)> = (event: T, entities: ConstructedEntity<CpId, number>[], world: World<CpId, EId>) => void;

export const regularSystem = <CpId extends (string | number), EId extends (string | number), EventType extends Event>(
  system: RegularSystem<EventType, CpId, EId>,
  components: CpId[],
): System<EventType, World<CpId, EId>> => {
  return (event, world) => {
    const matchingEntities = queryEntities(components, world);
    return system(event, matchingEntities, world);
  }
}