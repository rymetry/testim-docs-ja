import { defineCollection, z } from 'astro:content';

const docs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    order: z.number().default(0),
    updated: z.string().optional(),
    sourceUrl: z.string().url().optional(),
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
