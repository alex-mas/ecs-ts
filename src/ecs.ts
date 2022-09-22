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
  execute: System<Ev>,
  priority: number
}

export class World<CpType extends string = string>{
  components: Map<CpType,Component<any>[]> = new Map();
  systems: Map<string,  RegisteredSystem<any>[]>= new Map();
  createEventChain(event: string) {
    const systems: RegisteredSystem<any>[] = [];
    const chainCreator = {
      addSystem: function <Ev extends Event>(sys: System<Ev>) {
        systems.push({
          priority: systems.length,
          execute: sys
        });
        return this as typeof chainCreator;
      },
      register: () => {
        systems.forEach((s) => s.priority = systems.length - s.priority);
        const existingSystems =this.systems.get(event);
        if(!existingSystems){
          this.systems.set(event, systems);
        }else{
          this.systems.set(event,existingSystems.concat(systems));
        }
        return this as World;
      }
    };
    return chainCreator;
  }
  dispatch<Ev extends Event<{}>>(event: Ev)  {
    const relevantSystems = this.systems.get(event.type);
    relevantSystems?.forEach((sys)=>sys.execute(event, this));
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