

export type System<Ev extends Event> = (event: Ev, world: World) => void

export type Event<Payload extends object = any> = Payload & {
  type: string,
}

export type RegisteredSystem<Ev extends Event = Event<any>> = {
  execute: System<Ev>,
  priority: number
}


export class World{
  components: Map<string,any>
  systems: Map<string,  RegisteredSystem<any>[]>
  createEventChain = (event: string) => {
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
      }
    };
    return chainCreator;
  }
  dispatch = <Ev extends Event<{}>>(event: Ev) => {
    const relevantSystems = this.systems.get(event.type);
    relevantSystems?.forEach((sys)=>sys.execute(event, this))
  }
}  