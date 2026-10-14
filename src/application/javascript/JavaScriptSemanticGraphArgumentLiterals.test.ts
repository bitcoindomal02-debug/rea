import { expect, it } from "vitest";

import { graphForJavaScript as graphFor } from "../../../tests/fixtures/javascriptSemanticGraph.js";
import { queryJavaScriptSemanticGraph } from "../../domain/javascript/javascriptSemanticQuery.js";

it("preserves provenance of numeric array literals passed as a direct call argument", () => {
  const graph = graphFor(`
    function calculateTotal(prices) { return prices; }
    calculateTotal([10, 20, 30]);
  `);

  const argument = graph.nodes.find(
    ({ kind, identity, label }) =>
      kind === "expression" &&
      identity.role_key.startsWith("argument:") &&
      label === "argument 0",
  );
  expect(argument).toBeDefined();
  if (argument === undefined) return;

  const provenance = queryJavaScriptSemanticGraph(graph, {
    seed: { kind: "semantic-node", node_id: argument.node_id },
    direction: "backward-provenance",
    include_ambiguous_dynamic_edges: true,
  });

  const literalValues = provenance.nodes
    .filter(({ kind, properties }) =>
      kind === "literal" && typeof properties.value === "number",
    )
    .map(({ properties }) => properties.value)
    .sort((left, right) => Number(left) - Number(right));

  // This is static source provenance, not an evaluation of the callee.
  expect(literalValues).toEqual([10, 20, 30]);
});
