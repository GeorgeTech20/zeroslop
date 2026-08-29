/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as devTokens from "../devTokens.js";
import type * as developers from "../developers.js";
import type * as evaluations from "../evaluations.js";
import type * as mcp from "../mcp.js";
import type * as mcpTokens from "../mcpTokens.js";
import type * as metrics from "../metrics.js";
import type * as resources from "../resources.js";
import type * as seed from "../seed.js";
import type * as types from "../types.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  devTokens: typeof devTokens;
  developers: typeof developers;
  evaluations: typeof evaluations;
  mcp: typeof mcp;
  mcpTokens: typeof mcpTokens;
  metrics: typeof metrics;
  resources: typeof resources;
  seed: typeof seed;
  types: typeof types;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
