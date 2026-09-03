/* eslint-disable */
/**
 * Generated utilities for implementing server-side Convex functions.
 *
 * This file is checked in as a bootstrap helper so the app typechecks before
 * the first authenticated Convex codegen run. `npx convex dev` may overwrite it.
 */

import {
  actionGeneric,
  httpActionGeneric,
  internalActionGeneric,
  internalMutationGeneric,
  internalQueryGeneric,
  mutationGeneric,
  queryGeneric,
  type GenericActionCtx,
  type GenericDatabaseReader,
  type GenericDatabaseWriter,
  type GenericMutationCtx,
  type GenericQueryCtx
} from "convex/server";
import type { DataModel } from "./dataModel.js";

export const query = queryGeneric;
export const internalQuery = internalQueryGeneric;
export const mutation = mutationGeneric;
export const internalMutation = internalMutationGeneric;
export const action = actionGeneric;
export const internalAction = internalActionGeneric;
export const httpAction = httpActionGeneric;

export const env: Record<string, string | undefined> = process.env;

export type QueryCtx = GenericQueryCtx<DataModel>;
export type MutationCtx = GenericMutationCtx<DataModel>;
export type ActionCtx = GenericActionCtx<DataModel>;
export type DatabaseReader = GenericDatabaseReader<DataModel>;
export type DatabaseWriter = GenericDatabaseWriter<DataModel>;
