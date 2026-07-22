import { api } from '@/api/axios';
import type {
  CreatePostRequest,
  Page,
  PostDetail,
  PostSummary,
  UpdatePostRequest,
} from '@/types';

export interface ListPostsParams {
  published?: boolean;
  page?: number;
  size?: number;
}

/**
 * List posts, optionally filtered by published state, with pagination.
 *
 * @param params filter and pagination options
 */
export async function listPosts(
  params: ListPostsParams = {},
): Promise<Page<PostSummary>> {
  const { data } = await api.get<Page<PostSummary>>('/posts', { params });
  return data;
}

/**
 * Fetch a single post's full detail by its slug.
 *
 * @param slug the post slug
 */
export async function getPost(slug: string): Promise<PostDetail> {
  const { data } = await api.get<PostDetail>(`/posts/${slug}`);
  return data;
}

/**
 * Create a new post (admin/contributor).
 *
 * @param payload the post fields
 */
export async function createPost(
  payload: CreatePostRequest,
): Promise<PostDetail> {
  const { data } = await api.post<PostDetail>('/posts', payload);
  return data;
}

/**
 * Update an existing post by id.
 *
 * @param id post id
 * @param payload the updated post fields
 */
export async function updatePost(
  id: number,
  payload: UpdatePostRequest,
): Promise<PostDetail> {
  const { data } = await api.put<PostDetail>(`/posts/${id}`, payload);
  return data;
}

/**
 * Publish or unpublish a post.
 *
 * @param id post id
 * @param published whether the post should be published
 */
export async function publishPost(
  id: number,
  published: boolean,
): Promise<PostDetail> {
  const { data } = await api.patch<PostDetail>(`/posts/${id}/publish`, {
    published,
  });
  return data;
}
