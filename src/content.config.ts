import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const docs = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    order: z.number().default(0),
    updated: z.string(),
    sourceUrl: z.string().url(),
    hero: z
      .object({
        eyebrow: z.string().optional(),
        title: z.string(),
        subtitle: z.string(),
        primaryCta: z
          .object({
            label: z.string(),
            href: z.string().url(),
          })
          .optional(),
        secondaryCta: z
          .object({
            label: z.string(),
            href: z.string().url(),
          })
          .optional(),
      })
      .optional(),
    keywords: z.array(z.string()).default([]),
  }),
});

export const collections = {
  docs,
};
