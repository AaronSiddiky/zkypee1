import { redirect } from "next/navigation";

export default function BlogPage() {
  // Redirect to the skype-shutting-down blog post
  redirect("/blog/skype-shutting-down");
}
