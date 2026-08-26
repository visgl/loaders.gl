// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {z} from 'zod';

import type {SQLPredicate, SQLPredicateValue} from './sql-predicate-types';

/** Zod schema for scalar values accepted by in-process SQL predicates. */
export const SQLPredicateValueSchema: z.ZodType<SQLPredicateValue> = z.union([
  z.boolean(),
  z.number().finite(),
  z.bigint(),
  z.string(),
  z.date(),
  z.instanceof(Uint8Array),
  z.object({parameter: z.string().min(1)}).strict()
]);

const SQLPredicatePropertySchema = z
  .object({property: z.string().min(1), quoted: z.boolean().optional()})
  .strict();

/**
 * Optional Zod schema for validating the portable loaders.gl SQL predicate AST.
 *
 * Import from `@loaders.gl/sql/sql-predicate-zod`; the package root does not load Zod.
 */
export const SQLPredicateSchema: z.ZodType<SQLPredicate> = z.lazy(() =>
  z.union([
    z
      .object({
        op: z.enum(['=', '<>', '<', '<=', '>', '>=']),
        args: z.tuple([SQLPredicatePropertySchema, SQLPredicateValueSchema])
      })
      .strict(),
    z
      .object({
        op: z.literal('in'),
        args: z.tuple([SQLPredicatePropertySchema, z.array(SQLPredicateValueSchema).min(1)])
      })
      .strict(),
    z.object({op: z.literal('isNull'), args: z.tuple([SQLPredicatePropertySchema])}).strict(),
    z
      .object({
        op: z.enum(['and', 'or']),
        args: z.array(SQLPredicateSchema).min(2)
      })
      .strict(),
    z.object({op: z.literal('not'), args: z.tuple([SQLPredicateSchema])}).strict()
  ])
);
