# About

ecs-ts is a non opinionated and small library that provides utilities to build [entity component systems](https://en.wikipedia.org/wiki/Entity_component_system). It has no dependencies and since its built on typescript it provides the safety of types when it is possible. 


# Getting Started

Install the package via npm
```sh
npm install @axc/ecs-ts
```
or

```sh
yarn add @axc/ecs-ts
```

# Documentation

## Component

A component is just data, it can be anything from a string, number or boolean to an object. Think of it of a feature, like Health or Movement.

## Entity

An entity is a dictionary that holds an id and components

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

```

Common System operations can be abstarcted via Higher Order Functions, for example, a common use case is to only iterate on entites that have a set of components, that can be achieved by the utility function provided by this library 
```js
const physicsSystem = regularSystem((entities, event, world)=>{
    for(let entity in entities){
        //entity will allways contain a body component
        phsyicsEngine.update(entity.body);
    }
}, ['body']);
```

## World

The world holds all the data required for a simulation to run, that is, the entities and the systems. On top of that, its api allows you to dispatch events that are listened by your systems.

```js
import {World} from '@axc/ecs-ts';

const world = new World();

world.registerSystem(yourSystem,'periodic');

world.dispatch({type: 'periodic' dt: 1000/60});

```

## A simple demo

Bringing everything together

```js
import {World} from '@axc/ecs-ts';

const world = new World();

const yourEntity = {
    id: '1',
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

world.dispatch({type: 'periodic',dt: 1000/60});

```


# API Documentation
You can see the automatically generated documentation [here](https://alex-mas.github.io/ecs-ts/modules/_ecs_.html)



# Usage tips

## Events

While the dispatching of events is built into the world, you have two options:

- You can represent application specific events as entities, and only dispatch periodic events, letting the systems take care of it by filtering the components.
- You can dispatch the application specific events themselves and setup the systems to listen to the events

In the end both ways allow for intercepting and modifying the events, for example, an armor systems that detects damage events and reduces its amount.

## Compponent complexity

Try to minimize the complexity of the components, chances are that if a component is getting complex it could be better represented as a set an entity and its features broken into their own components. In the end this will result in more flexibility and easier code to read/maintain.
