# About

ecs-ts is 50 loc library that provides utilities to build [entity component systems](https://en.wikipedia.org/wiki/Entity_component_system)
It aims to provide a simple and functional api.

# Getting Started

Install the package via npm
```sh
npm install @axc/ecs-ts
```

And start writing your components and systems. 
```js
import {World} from '@axc/ecs-ts';

const world = new World();

const yourEntity = {
    foo: 'World!'
}
world.entities.push(yourEntity);

world.registerSystem((entities, event,world)=>{
    for(let entity in entities){
        if(entity.foo){
            console.log('Hello' + entity.foo);
        }
    }
},'periodic', 1);

```

# Documentation

## World

The world holds all the data required for a simulation to run, that is, the entities and the systems. On top of that, its api allows you to dispatch events that are listened by your systems.

```js
import {World} from '@axc/ecs-ts';

const world = new World();

world.registerSystem(yourSystem,'periodic');

world.dispatch({type: 'periodic' dt: 1000/60});

```
## Entity

An entity is a dictionary that holds an id and component data

```js
const entity = {
    id: '1',
    body: createBodyComponent(),
    health: createHealthComponent()
}

```


## System

A system is a function that performs some operations on the entities when the event it listens to is dispatched.
```js
const system = (entities, event, world)=>{
    for(let entity in entities){
        //do some work
    }
}
//later 
world.registerSystem(system,'periodic');
```

Common System operations can be abstarcted via Higher Order Functions, for example, a common use case is to only iterate on entites that have a set of components, that can be achieved by the utility function provided by this library
This can be implemented easily as follows
```js
const regularSystem = (system, components)=>{
    return(entities, event, world)=>{
        system(
            enties.filter(entity =>components.every((component) => !!(Object.keys(entity)).find((key)=>key === component))),
            event,
            world
        )
    }
}
```
```js
const physicsSystem = regularSystem((entities, event, world)=>{
    for(let entity in entities){
        //entity will allways contain body component
        phsyicsEngine.update(entity);
    }
}, ['body']);
//later 
world.registerSystem(yourSystem,'periodic');
```



# API Documentation
You can see the generated documentation [here](https://alex-mas.github.io/ecs-ts/modules/_ecs_.html)

