import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const docs = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/docs' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    category: z.string(),
    order: z.number().default(0),
    updated: z.string(),
    sourceUrl: z.url(),
    hero: z
      .object({
        eyebrow: z.string().optional(),
        title: z.string(),
        subtitle: z.string(),
        primaryCta: z
          .object({
            label: z.string(),
            href: z.url(),
          })
          .optional(),
        secondaryCta: z
          .object({
            label: z.string(),
            href: z.url(),
          })
          .optional(),
      })
      .optional(),
    keywords: z.array(z.string()).default([]),
    hideToc: z.boolean().default(false),
  }),
});

export const collections = {
  docs,
};
