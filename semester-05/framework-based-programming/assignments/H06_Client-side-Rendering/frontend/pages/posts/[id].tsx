import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

interface Post {
  id: string;
  posterName: string;
  content: string;
  replyToId?: string | null;
  replies: Post[];
  createdAt: string;
  updatedAt: string;
}

const API_URL = "http://localhost:3000";

export default function PostDetails() {
  const [post, setPost] = useState<Post | null>(null);
  const [replyToPost, setReplyToPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { id: postId } = router.query;

  useEffect(() => {
    if (!router.isReady || typeof postId !== "string") {
      return;
    }

    let cancelled = false;

    async function loadPost() {
      setLoading(true);
      setError(null);
      setPost(null);
      setReplyToPost(null);

      try {
        const response = await fetch(`${API_URL}/posts/${postId}`);
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Post not found."
              : `Could not load post (${response.status}).`,
          );
        }

        const postData: Post = await response.json();
        if (cancelled) {
          return;
        }
        setPost(postData);

        if (postData.replyToId) {
          const parentResponse = await fetch(
            `${API_URL}/posts/${postData.replyToId}`,
          );
          if (!parentResponse.ok) {
            throw new Error(
              `Could not load the original post (${parentResponse.status}).`,
            );
          }

          const parentData: Post = await parentResponse.json();
          if (!cancelled) {
            setReplyToPost(parentData);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setPost(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load post.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPost();
    return () => {
      cancelled = true;
    };
  }, [postId, router.isReady]);

  async function handleDelete() {
    if (!post || !window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`${API_URL}/posts/${post.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Could not delete post (${response.status}).`);
      }

      await router.push("/");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete post.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!post) {
    return (
      <div>
        <div className="alert alert-danger" role="alert">
          {error ?? "Post not found."}
        </div>
        <Link href="/" className="btn btn-secondary">
          Back to Posts
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Post Details</h1>
        <div>
          <Link href={`/posts/${post.id}/edit`} className="btn btn-warning me-2">
            Edit
          </Link>
          <Link href="/" className="btn btn-secondary">
            Back to Posts
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {replyToPost && (
        <div className="mb-4 p-3 bg-light border-start border-4 border-primary">
          <div className="small text-muted mb-2">This is a reply to:</div>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <strong>{replyToPost.posterName}</strong>
            <small className="text-muted">{replyToPost.createdAt}</small>
          </div>
          <div className="mb-2">{replyToPost.content}</div>
          <Link
            href={`/posts/${replyToPost.id}`}
            className="btn btn-sm btn-outline-primary"
          >
            View Original Post
          </Link>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <h5 className="mb-0">
              <strong>{post.posterName}</strong>
            </h5>
            <small className="text-muted">{post.createdAt}</small>
          </div>
          <p className="card-text">{post.content}</p>
          <div className="mt-3">
            <small className="text-muted">
              <strong>ID:</strong> {post.id}
              <br />
              <strong>Created:</strong> {post.createdAt}
              <br />
              <strong>Updated:</strong> {post.updatedAt}
            </small>
          </div>
        </div>
      </div>

      <div className="mt-3 d-flex gap-2">
        <Link href={`/posts/${post.id}/reply`} className="btn btn-primary">
          Reply
        </Link>
        <button
          type="button"
          className="btn btn-danger"
          disabled={isDeleting}
          onClick={() => void handleDelete()}
        >
          {isDeleting ? "Deleting..." : "Delete Post"}
        </button>
      </div>

      {post.replies.length > 0 && (
        <div className="mt-4">
          <h4>Replies ({post.replies.length})</h4>
          {post.replies.map((reply) => (
            <div key={reply.id} className="card mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <strong>{reply.posterName}</strong>
                  <small className="text-muted">{reply.createdAt}</small>
                </div>
                <p className="card-text">{reply.content}</p>
                <Link
                  href={`/posts/${reply.id}`}
                  className="btn btn-sm btn-outline-primary"
                >
                  View Reply
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
