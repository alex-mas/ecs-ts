import { regularSystem } from "../../../src/ecs";
import { ComponentType } from "../components/componentType";

export const dummySystem = regularSystem((entities, event, world)=>{

}, [ComponentType.ATTACK, ComponentType.HEALTH])