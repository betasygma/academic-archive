import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const API_URL = "http://localhost:3000";

export default function NewPost() {
  const [posterName, setPosterName] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!posterName.trim() || !content.trim()) {
      setError("Name and content are required.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posterName: posterName.trim(),
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Could not create post (${response.status}).`);
      }

      await router.push("/");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not create post.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h1>Create New Post</h1>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

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
            onChange={(event) => setPosterName(event.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="content" className="form-label">
            Content
          </label>
          <textarea
            className="form-control"
            id="content"
            rows={5}
            maxLength={25000}
            required
            placeholder="What's on your mind?"
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </div>

        <div className="d-flex gap-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Post"}
          </button>
          <Link href="/" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
