import { addNode, createGraph, removeNode } from "../src/graph";

test('Constructors without parameters should return empty array', () => {

  const graph = createGraph();

  expect(graph.length).toBe(0);

});

test('Constructors with parameters should array of N length where N is the number of parameters', () => {

  const graph = createGraph(1, 2, 3, 4, 5);

  expect(graph.length).toBe(5);

  const graph2 = createGraph(1);

  expect(graph2.length).toBe(1);

});




test('addNode should properly store references to parent/children nodes respectively', () => {

  const graph = createGraph('10');

  addNode('50', 0, graph);

  expect(graph.length).toBe(2);
  expect(graph[0].children.length).toBe(1);
  expect(graph[0].children[0]).toBe(1);
  expect(graph[1].parents.length).toBe(1);
  expect(graph[1].parents[0]).toBe(0);
});


test('removeNode should remove a node and update its parent', () => {

  let graph = createGraph('10');

  addNode('50', 0, graph);
  graph = removeNode('50', graph);
  expect(graph.length).toBe(1);
  expect(graph[0].children.length).toBe(0);
});



test('removeNode should recursively remove orphan-ed nodes by default', () => {

  let graph = createGraph('10');

  addNode('50', 0, graph);
  addNode('60', 1, graph);
  addNode('70', 2, graph);
  addNode('90', 1, graph);
  graph = removeNode('50', graph);
  expect(graph.length).toBe(1);
  expect(graph[0].children.length).toBe(0);
});

test('removeNode shouldn\'t remove orphan-ed nodes if indicated not to', () => {

  let graph = createGraph('10');

  addNode('50', 0, graph);
  addNode('60', 1, graph);
  graph = removeNode('50', graph, false);
  expect(graph.length).toBe(2);
  expect(graph[0].children.length).toBe(0);
});