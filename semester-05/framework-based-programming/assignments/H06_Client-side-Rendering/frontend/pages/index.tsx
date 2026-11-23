import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Post {
  id: string;
  posterName: string;
  content: string;
  replyToId?: string | null;
  createdAt: string;
  updatedAt: string;
  replies: Post[];
}

const API_URL = "http://localhost:3000";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/posts`);
      if (!response.ok) {
        throw new Error(`Could not load posts (${response.status}).`);
      }

      const data: Post[] = await response.json();
      setPosts(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load posts.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setError(null);
    setDeletingId(id);

    try {
      const response = await fetch(`${API_URL}/posts/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Could not delete post (${response.status}).`);
      }

      setPosts((currentPosts) => currentPosts.filter((post) => post.id !== id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete post.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const topLevelPosts = posts.filter((post) => !post.replyToId);

  return (
    <>
      <h1>My Posts</h1>

      <Link href="/posts/new" className="btn btn-primary mb-3">
        Create New Post
      </Link>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center" role="status">
          Loading posts...
        </div>
      ) : topLevelPosts.length > 0 ? (
        <div>
          {topLevelPosts.map((post) => (
            <div key={post.id} className="post mb-4 p-3 border rounded">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h5 className="mb-0">
                  <strong>{post.posterName}</strong>
                </h5>
                <small className="text-muted">{post.createdAt}</small>
              </div>

              <p className="mb-2">
                <Link
                  href={`/posts/${post.id}`}
                  className="text-dark text-decoration-none"
                >
                  {post.content}
                </Link>
              </p>

              <div className="mt-3">
                <Link
                  href={`/posts/${post.id}`}
                  className="btn btn-sm btn-info me-2"
                >
                  View
                </Link>
                <Link
                  href={`/posts/${post.id}/reply`}
                  className="btn btn-sm btn-success me-2"
                >
                  Reply
                </Link>
                <Link
                  href={`/posts/${post.id}/edit`}
                  className="btn btn-sm btn-warning me-2"
                >
                  Edit
                </Link>
                <button
                  className="btn btn-sm btn-danger"
                  disabled={deletingId === post.id}
                  onClick={() => void handleDelete(post.id)}
                >
                  {deletingId === post.id ? "Deleting..." : "Delete"}
                </button>
              </div>

              {post.replies.length > 0 && (
                <div className="mt-3 ms-3 border-start border-3 ps-3">
                  <h6 className="text-muted mb-3">
                    Replies ({post.replies.length}):
                  </h6>
                  {post.replies.map((reply) => (
                    <div key={reply.id} className="mb-2 p-2 bg-light rounded">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong className="small">{reply.posterName}</strong>
                        <small className="text-muted">{reply.createdAt}</small>
                      </div>
                      <p className="mb-0 small">
                        <Link
                          href={`/posts/${reply.id}`}
                          className="text-dark text-decoration-none"
                        >
                          {reply.content}
                        </Link>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !error && (
          <div className="alert alert-info">
            <h4>No posts yet</h4>
            <p>Be the first to create a post!</p>
            <Link href="/posts/new" className="btn btn-primary">
              Create First Post
            </Link>
          </div>
        )
      )}
    </>
  );
}
