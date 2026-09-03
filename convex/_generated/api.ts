/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * This file is checked in as a bootstrap helper so the app typechecks before
 * the first authenticated Convex codegen run. `npx convex dev` may overwrite it.
 */

import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";
import { anyApi } from "convex/server";
import type * as runs from "../runs.js";
import type * as waitlist from "../waitlist.js";

const fullApi: ApiFromModules<{
  runs: typeof runs;
  waitlist: typeof waitlist;
}> = anyApi as any;

export const api: FilterApi<typeof fullApi, FunctionReference<any, "public">> = anyApi as any;
export const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">> =
  anyApi as any;
