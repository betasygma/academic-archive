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

export default function ReplyToPost() {
  const [post, setPost] = useState<Post | null>(null);
  const [posterName, setPosterName] = useState("");
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

    if (!posterName.trim() || !content.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:3000/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          posterName: posterName.trim(),
          content: content.trim(),
          replyToId: postId,
        }),
      });

      if (response.ok) {
        router.push(`/posts/${postId}`);
      } else {
        alert("Error creating reply");
      }
    } catch {
      alert("Error creating reply");
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
      <h1>Reply to Post</h1>

      <div className="mb-4 p-3 bg-light border-start border-4 border-secondary">
        <div className="small text-muted mb-2">Replying to:</div>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <strong>{post.posterName}</strong>
          <small className="text-muted">{post.createdAt}</small>
        </div>
        <div>{post.content}</div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="posterName" className="form-label">
            Your Name
          </label>
          <input
            type="text"
            className="form-control"
            id="posterName"
            maxLength={100}
            required
            value={posterName}
            onChange={(e) => setPosterName(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="content" className="form-label">
            Your Reply
          </label>
          <textarea
            className="form-control"
            id="content"
            rows={5}
            required
            placeholder="Write your reply here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="d-flex gap-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Posting..." : "Post Reply"}
          </button>
          <Link href={`/posts/${postId}`} className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}