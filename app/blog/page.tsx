import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zkypee Blog | Communication Tips & Best Skype Alternatives",
  description:
    "Learn about communication tools, tips, and the best Skype alternatives as Skype is shutting down. Discover why Zkypee is the perfect free Skype replacement.",
  alternates: {
    canonical: "https://zkypee.com/blog/skype-shutting-down",
  },
};

export default function BlogPage() {
  // Redirect to the skype-shutting-down blog post
  redirect("/blog/skype-shutting-down");
}
