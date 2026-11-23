import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

interface Post {
  id: string;
  posterName: string;
  content: string;
  replyToId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditPost() {
  const [post, setPost] = useState<Post | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { id: postId } = router.query;

  useEffect(() => {
    if (!postId) return;

    async function fetchPost() {
      try {
        const response = await fetch(`http://localhost:3000/posts/${postId}`);
        if (response.ok) {
          const postData = await response.json();
          setPost(postData);
          setContent(postData.content);
        } else {
          router.push("/");
        }
      } catch {
        router.push("/");
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [postId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!content.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`http://localhost:3000/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (response.ok) {
        router.push(`/posts/${postId}`);
      } else {
        alert("Error updating post");
      }
    } catch {
      alert("Error updating post");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <>
      <h1>Edit Post</h1>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="content" className="form-label">
            Content
          </label>
          <textarea
            className="form-control"
            id="content"
            rows={5}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <small className="text-muted">
            <strong>Posted by:</strong> {post.posterName}
            <br />
            <strong>Created:</strong> {post.createdAt}
            <br />
            <strong>Last Updated:</strong> {post.updatedAt}
          </small>
        </div>

        <div className="d-flex gap-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Post"}
          </button>
          <Link href={`/posts/${postId}`} className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}