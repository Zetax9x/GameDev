import type { APIRoute } from 'astro';
import { devlogFeed } from '../../lib/rss';

export const GET: APIRoute = (context) => devlogFeed('en', context);
