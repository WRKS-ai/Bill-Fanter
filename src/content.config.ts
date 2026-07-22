// Content collections. `blog` posts are markdown files in src/content/blog.
// Each post is built around one of Bill's YouTube videos (videoId) so the
// article ranks in search and funnels readers to the channel.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // The YouTube video this post is built around.
    videoId: z.string(),
    videoTitle: z.string(),
    // When the video itself went live on the channel (VideoObject uploadDate).
    videoUploadDate: z.coerce.date(),
    // Short label shown on the listing card ("Volatility", "Psychology"...).
    tag: z.string(),
  }),
});

export const collections = { blog };
