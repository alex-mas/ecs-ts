import { addNode, DirectedGraph, DirectedGraphNode } from "./graph";


const mapSystemsToNodes = <T>(systems: System<T>[], graph: DirectedGraph<RegisteredSystem<T>>) => {
  return systems.map((s) => graph.findIndex((v) => v.value.execute === s))
}


type Dict<ValTyp = any> = {
  [key: string]: ValTyp
}
export type Component<Payload extends object = {}, EntityIdType =string> = 
  Payload & {
    $$type: string,
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

export class World<CpType extends string = string>{
  runner: SystemRunner;
  components: Map<CpType,Component<any>[]> = new Map();
  systems: Map<string, DirectedGraph<RegisteredSystem<any>>> = new Map();
  constructor(runner: SystemRunner = defaultSystemRunner) {
    this.runner = runner;
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

export const getEntity = (entityId: string,components: Map<string, Component[]>)=>{
  const entity: Dict<Component[]>= {};
  components.forEach((val,key)=>{
    entity[key] = val.filter((cp)=>cp.$$entityId===entityId);
  });
  return entity;
}