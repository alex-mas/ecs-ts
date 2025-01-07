import { addNode, DirectedGraph } from "./graph";


const mapSystemsToNodes = <T, WorldType extends World<any, any,any>>(systems: System<T, WorldType>[], graph: DirectedGraph<RegisteredSystem<T, WorldType>>) => {
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
export type System<Ev extends Event, T extends World<any, any,any> = World> = (event: Ev, world: T) => void

export type RegisteredSystem<Ev extends Event = Event<any>, WorldType extends World<any, any,any> = World> = {
  execute: System<Ev, WorldType>
}

export type SystemRunner<CpType extends (string | number) = string, EId extends (string | number) = string,TypeMap extends {[P in CpType]: Component<any, EId, CpType>} = {[P in CpType]:Component<any, EId, CpType>}> = <T>(system: DirectedGraph<RegisteredSystem<T, World<CpType, EId, TypeMap>>>, event: T, world: World<CpType, EId,TypeMap>) => Promise<number>;

export const defaultSystemRunner: SystemRunner =
  async (systems, event, world) => {
    let available = systems.filter((v) => {
      return v.parents.length === 0;
    });
    let executing: typeof available = [];

    while (available.length > 0 || executing.length > 0) {
      if (available.length === 0) {
        continue;
      }
      const toExecute = available;
      executing.push(...available);
      available = [];
      const completed = await Promise.allSettled(toExecute.map(async (s) => {
        try {
          const res = s.value.execute(event, world);
          const execIndex = executing.indexOf(s);
          if (execIndex >= 0) {
            executing.splice(execIndex);
          }
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
    }
    return 0;
  }




interface ComponentMap<CpType extends (string | number),EId extends (string | number) = string, TypeMap extends {[P in CpType]: Component<any, EId, CpType>} = {[P in CpType]:Component<any, EId, CpType>}> extends Map<CpType,Map<EId,TypeMap[CpType][]>> {
    get: <K extends (string | number)> (key: K)=> K extends CpType ? Map<EId,TypeMap[K][]> : undefined;
}



export class World<CpType extends (string | number) = string, EId extends (string | number) = string, TypeMap extends {[P in CpType]: Component<any, EId, CpType>} = {[P in CpType]:Component<any, EId, CpType>}>{
  runner: SystemRunner<CpType, EId,TypeMap>;
  components: ComponentMap<CpType,EId,TypeMap> = new Map();
  systems:Map<string, DirectedGraph<RegisteredSystem<any, World<CpType, EId,TypeMap>>>> = new Map();
  entityMap: Map<EId, CpType[]> = new Map();
  archetypeMap: Map<CpType[], EId[]> = new Map();
  constructor(runner: SystemRunner<CpType, EId,TypeMap> = defaultSystemRunner) {
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
    let previousArchetype = this.entityMap.get(ownerId) || [];

    if (!previousArchetype.includes(component.$$type)) {
      const previousArchetypeEntities = this.archetypeMap.get(previousArchetype) as EId[];
      if(previousArchetypeEntities){
        previousArchetypeEntities.splice(previousArchetypeEntities.indexOf(ownerId), 1);
      }
    }
    //find and set new archetype
    for (let [archetype, v] of this.archetypeMap) {
      if (archetype.length === previousArchetype.length + 1 && archetype.every((cp) => {
        return cp === component.$$type || previousArchetype.includes(cp);
      })) {
        v.push(ownerId);
        this.entityMap.set(ownerId, archetype);
        break;
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
 * Expects the components Map to be initialized for the given component types, archetype is compared with reference equality
 * to register the entity archetype relationship, therefore, it is expected for it to be the same array that defines the 
 * desired archetype.
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
    const entityArchetype = this.entityMap.get(owner) as CpType[];
    //@ts-ignore
    entityArchetype.set(component.$$type, entityArchetype.get(component.$$type) - 1);
    const currentCps = this.components.get(component.$$type)?.get(owner) as any[];

    currentCps.splice(currentCps.indexOf(component),1);
    //archetype doesn't change if we have more than one of the component type we're deleting
    if(currentCps.length > 0) {
      return;
    }

    //remove entitiy from archetype
    const archetypeEntities = this.archetypeMap.get(entityArchetype) as EId[];
    archetypeEntities.splice(archetypeEntities.indexOf(owner), 1);
    //add it to new archetype
    const newArchetype = entityArchetype.filter((v) => v !== component.$$type);
    this.archetypeMap.forEach((entities, aType) => {
      if (newArchetype.every((v) => aType.includes(v))) {
        entities.push(owner);
      }
    })
  }


  removeEntity(entityId: EId) {
    const cpTypes = this.entityMap.get(entityId) as CpType[];
    this.entityMap.delete(entityId);
    cpTypes.forEach((type) => {
      //@ts-ignore
      this.components.get(type).delete()
    });
    const archetypeEntities = this.archetypeMap.get(cpTypes);
    if(!archetypeEntities){return;}
    archetypeEntities.splice(archetypeEntities.indexOf(entityId),1)
  }

  createEventChain(event: string) {
    const systemsGraph: DirectedGraph<RegisteredSystem<any, World<CpType, EId,TypeMap>>> = [];
    const chainCreator = {
      addSystem: function <Ev extends Event>(sys: System<Ev, World<CpType, EId,TypeMap>>, dependsOn: System<Ev, World<CpType, EId,TypeMap>>[] = []) {
        addNode({
          execute: sys
        }, mapSystemsToNodes(dependsOn, systemsGraph), systemsGraph);
        return this as typeof chainCreator;
      },
      addSystems: function <Ev extends Event>(sys: System<Ev, World<CpType, EId,TypeMap>>[], dependsOn: System<Ev, World<CpType, EId,TypeMap>>[] = []) {
        sys.forEach((s) => {
          addNode({
            execute: s
          }, mapSystemsToNodes(dependsOn, systemsGraph), systemsGraph);
        })
        return this as typeof chainCreator;
      },
      register: (): World<CpType, EId,TypeMap> => {
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


/**
 * 
 *  Entity must be defined on the world, otherwise this function will throw
 */
export const getComponents =
  <
    CpId extends (string | number) = string,
    EId extends (string | number) = string
  >
    (entityId: EId, componentType: CpId, cpMap: World<CpId, EId>['components']) => {
  //@ts-ignore - we expect cp to be there
  return cpMap.get(componentType).get(entityId);
}

/**
 * 
 *  Entity must be defined on the world, otherwise this function will throw
 */
export const getEntityComponent =
<
  CpId extends (string | number) = string,
  EId extends (string | number) = string
>
  (entityId: EId, componentType: CpId, cpMap: World<CpId, EId>['components']) => {
//@ts-ignore - we expect cp to be there
return cpMap.get(componentType).get(entityId)[0];
}

type ConstructedEntity<CpId extends (string | number), EId extends (string | number),TypeMap extends {[P in CpId]: Component<any, EId, CpId>} = {[P in CpId]:Component<any, EId, CpId>}> = { $$id: EId } & { [x in CpId]?: TypeMap[x][] };

export const getEntity = <CpId extends (string | number), EId extends (string | number),TypeMap extends {[P in CpId]: Component<any, EId, CpId>} = {[P in CpId]:Component<any, EId, CpId>}>(entityId: EId, world: World<CpId, EId,TypeMap>, components?: CpId[]) => {
  const cpMap = world.components;
  const entity: any = {
    $$id: entityId
  }
  if (components) {
    components.forEach((cp) => {
      //@ts-ignore - we expect cp and the entityId key to be there.
      entity[cp] = cpMap.get(cp).get(entityId);
    });
  } else {
    cpMap.forEach((val, key) => {
      const cps = val.get(entityId);
      if(cps){
        entity[key] = cps;
      }
    });
  }
  return entity as ConstructedEntity<CpId, EId>
}


export type QueryEntitiesFilter<CpId extends (string | number), EId extends (string | number),TypeMap extends {[P in CpId]: Component<any, EId, CpId>} = {[P in CpId]:Component<any, EId, CpId>}> =
  (components: CpId[], world: World<CpId, EId>, getOtherComponents?: boolean) => ConstructedEntity<CpId, EId,TypeMap>

export const queryEntities = <CpId extends (string | number), EId extends (string | number),TypeMap extends {[P in CpId]: Component<any, EId, CpId>} = {[P in CpId]:Component<any, EId, CpId>}>(components: CpId[], world: World<CpId, EId,TypeMap>) => {
  const constructedEntities: ConstructedEntity<CpId,EId,TypeMap>[] = [];
  for(let [archetype, entities] of world.archetypeMap){
    if (archetype !== components && components.some((cpType) => !archetype.includes(cpType))) { continue;}
    for(let entityId of entities){
      constructedEntities.push(getEntity(entityId,world));
    }
  }
  return constructedEntities;
}

export const queryArchetype = <CpId extends (string | number), EId extends (string | number),TypeMap extends {[P in CpId]: Component<any, EId, CpId>} = {[P in CpId]:Component<any, EId, CpId>}>(archetype: CpId[], world: World<CpId, EId,TypeMap>) => {
  let entities: ConstructedEntity<CpId,EId,TypeMap>[] = [];
  world.archetypeMap.forEach((ets, aType) => {
    if (aType !== archetype && archetype.some((cpType) => !aType.includes(cpType))) {
      return;
    }
    ets.forEach((e)=>{
      entities.push(getEntity(e, world, archetype)) 
    })
  })
  return entities;
}

export type RegularSystem<T extends Event, CpId extends (string | number), EId extends (string | number),TypeMap extends {[P in CpId]: Component<any, EId, CpId>} = {[P in CpId]:Component<any, EId, CpId>}> = (event: T, entities: ConstructedEntity<CpId, EId>[], world: World<CpId, EId,TypeMap>) => void;

export const regularSystem = <CpId extends (string | number), EId extends (string | number), EventType extends Event,TypeMap extends {[P in CpId]: Component<any, EId, CpId>} = {[P in CpId]:Component<any, EId, CpId>}>(
  system: RegularSystem<EventType, CpId, EId,TypeMap>,
  components: CpId[],
): System<EventType, World<CpId, EId,TypeMap>> => {
  return (event, world) => {
    const matchingEntities = queryArchetype(components, world);
    return system(event, matchingEntities, world);
  }
}