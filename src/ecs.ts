import { addNode, DirectedGraph, DirectedGraphNode } from "./graph";


const mapSystemsToNodes = <T>(systems: System<T>[], graph: DirectedGraph<RegisteredSystem<T>>) => {
  return systems.map((s) => graph.findIndex((v) => v.value.execute === s))
}


type Dict<ValTyp = any> = {
  [key: string]: ValTyp
}
export type Component<Payload extends object = {}, EntityIdType extends string = string, CpType extends string = string> = 
  Payload & {
    $$type: CpType,
    $$entityId: EntityIdType
  }

export type Event<Payload extends object = any> = Payload & {
  type: string,
}
export type System<Ev extends Event> = (event: Ev, world: World) => void

export type RegisteredSystem<Ev extends Event = Event<any>> = {
  execute: System<Ev>
}

export type SystemRunner = <T>(system: System<T>, event: T, world: World) => Promise<number>;

export const defaultSystemRunner: SystemRunner = async<T>(system: System<T>, event: T, world: World) => {
  system(event, world);
  return 0;
}

export class World<CpType extends string = string, EId extends string = string>{
  runner: SystemRunner;
  components: Map<CpType, Map<EId, Component[]>> = new Map();
  systems: Map<string, DirectedGraph<RegisteredSystem<any>>> = new Map();
  entityMap: Map<EId, Map<CpType, number>> = new Map();
  constructor(runner: SystemRunner = defaultSystemRunner) {
    this.runner = runner;
  }

  registerTypes(componenType: CpType[]) {
    componenType.forEach((cType) => {
      this.registerType(cType);
    })
  }

  registerType(componenType: CpType) {
    this.components.set(componenType, new Map());
    return this;
  }
  /**
   * Expects the components Map to be initialized for the given component type, 
   * otherwise this method will throw when trying to get the existing components of the owner entity
   */
  addComponent<CpPayload extends {}>(component: Component<CpPayload, EId, CpType>) {
    const ownerId = component.$$entityId
    const owner = this.entityMap.get(ownerId);
    if (owner) {
      const cpCount = owner.get(component.$$type);
      if (cpCount) {
        owner.set(component.$$type, cpCount + 1)
      } else {
        owner.set(component.$$type, 1)
      }
    } else {
      const entries = new Map<CpType, number>();
      entries.set(component.$$type, 1);
      this.entityMap.set(ownerId, entries);
    }

    //@ts-ignore -> cpMap is  expected to be defined, otherwise we will fail and throw, this way we don't waste time checking
    const cpMap: Map<EId, Component[]> = this.components.get(component.$$type);

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
  addEntity<CpPayload extends {}>(entityId: EId, components: Component<CpPayload, EId, CpType>[]) {
    const cpTypes = new Map<CpType, number>();
    components.forEach((cp) => {
      cpTypes.set(cp.$$type, 0);
      //@ts-ignore -> cpMap is  expected to be defined, otherwise we will fail and throw, this way we don't waste time checking
      const cpMap: Map<EId, Component[]> = this.components.get(cp.$$type);
      const cpArr = cpMap.get(entityId);
      if (cpArr) {
        cpArr.push(cp);
      } else {
        cpMap.set(entityId, [cp]);
      }
    });
    this.entityMap.set(entityId, cpTypes);
  }

  removeComponent<CpPayload extends {}>(component: Component<CpPayload, EId, CpType>) {
    const owner = component.$$entityId;
    const entityComponents = this.entityMap.get(owner);
    //@ts-ignore
    entityComponents.set(component.$$type, entityComponents.get(component.$$type) - 1);
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
    const systemsGraph: DirectedGraph<RegisteredSystem<any>> = [];
    const chainCreator = {
      addSystem: function <Ev extends Event>(sys: System<Ev>, dependsOn: System<Ev>[] = []) {
        addNode({
          execute: sys
        }, mapSystemsToNodes(dependsOn, systemsGraph), systemsGraph);
        return this as typeof chainCreator;
      },
      addSystems: function <Ev extends Event>(sys: System<Ev>[], dependsOn: System<Ev>[] = []) {
        sys.forEach((s) => {
          addNode({
            execute: s
          }, mapSystemsToNodes(dependsOn, systemsGraph), systemsGraph);
        })
        return this as typeof chainCreator;
      },
      register: (): World<CpType> => {
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
    const executed: DirectedGraphNode<RegisteredSystem<Ev>>[] = [];
    let available = relevantSystems.filter((v) => {
      return v.parents.length === 0;
    });
    while (executed.length < relevantSystems.length) {
      if (available.length > 0) {
        const executing = available;
        available = [];
        const completed = await Promise.race(executing.map(async (s) => {
          try {
            const res = await this.runner(s.value.execute, event, this)
            executed.push(s);
            s.children.forEach((child) => {
              const childNode = relevantSystems[child];
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
    return this;
  }
}  

export const getComponent = <CpId extends string, EId extends string>(entityId: EId, componentType: CpId, cpMap: World<CpId, EId>['components']) => {
  //@ts-ignore
  return cpMap.get(componentType).get(entityId);
}

export const getEntity = <CpId extends string, EId extends string>(entityId: EId, cpMap: World<CpId, EId>['components'], components?: CpId[]) => {
  //@ts-ignore
  const entity: { $$id: EId } & { [x in CpId]?: Component } = {
    $$id: entityId
  }
  if (components) {
    components.forEach((cp) => {
      //@ts-ignore
      entity[cp] = cpMap.get(cp).get(entityId);
    });
  } else {
    cpMap.forEach((val, key) => {
      //@ts-ignore
      entity[key] = val.get(entityId);
    });
  }
  return entity;
}

export const queryEntities = <CpId extends string, EId extends string>(components: CpId[], world: World<CpId, EId>, getOtherComponents: boolean = false) => {
  const entityIds: EId[] = [];
  world.entityMap.forEach((val, key) => {
    if (components.every((cp) => val.has(cp))) {
      entityIds.push(key);
    }
  });
  return entityIds.map((eid) => {
    return getEntity(eid, world.components, getOtherComponents ? undefined : components);
  });
}