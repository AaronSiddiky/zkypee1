# Blog Post Template

## Metadata

```tsx
export const metadata: Metadata = {
  title: "[Post Title] | Zkypee Blog",
  description: "[150-160 character description with primary keywords]",
  keywords: "[comma-separated keywords]",
  openGraph: {
    title: "[Post Title] | Zkypee Blog",
    description: "[150-160 character description]",
    type: "article",
    publishedTime: "[YYYY-MM-DD]",
    authors: ["Zkypee Team"],
  },
};
```

## Post Structure

```tsx
export default function BlogPostPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-8">
      {/* Post Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">[Post Title]</h1>
        <div className="text-gray-500 text-sm mb-4">
          Published: [Month Day, Year] · Updated: [Month Day, Year]
        </div>
        <div className="border-b border-gray-200 pb-6">
          <p className="text-xl text-gray-700">
            [Post excerpt/introduction - 1-2 sentences that summarize the post]
          </p>
        </div>
      </div>

      {/* Post Content */}
      <div className="prose prose-lg max-w-none">
        <h2>[First Section Heading]</h2>
        <p>[Content paragraph]</p>

        <h2>[Second Section Heading]</h2>
        <p>[Content paragraph]</p>

        {/* Add more sections as needed */}

        <h2>Conclusion</h2>
        <p>[Concluding paragraph]</p>
      </div>

      {/* Author Bio */}
      <div className="mt-12 border-t border-gray-200 pt-8">
        <div className="flex items-center">
          <div className="mr-4 h-12 w-12 rounded-full bg-gray-200"></div>
          <div>
            <h3 className="font-bold">Author Name</h3>
            <p className="text-sm text-gray-600">[Brief author bio]</p>
          </div>
        </div>
      </div>

      {/* Related Posts */}
      <div className="mt-12">
        <h3 className="text-xl font-bold mb-4">Related Posts</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Related post cards would go here */}
        </div>
      </div>
    </article>
  );
}
```

## SEO Guidelines

1. **Title Tag**:

   - Keep between 50-60 characters
   - Include primary keyword near the beginning
   - Make it compelling and click-worthy

2. **Meta Description**:

   - Keep between 150-160 characters
   - Include primary and secondary keywords naturally
   - Write a compelling summary that encourages clicks

3. **Headings**:

   - Use H1 for the main title (only one per page)
   - Use H2 for main sections
   - Use H3 for subsections
   - Include keywords in headings where natural

4. **Content**:

   - Aim for 1,500+ words for comprehensive posts
   - Include primary keyword in the first 100 words
   - Use secondary keywords throughout naturally
   - Break up text with images, lists, and quotes

5. **Images**:

   - Include at least one featured image
   - Use descriptive filenames (e.g., "voip-communication-tips.jpg")
   - Add alt text with keywords where appropriate

6. **Internal Linking**:

   - Link to at least 3 other relevant blog posts or pages
   - Use descriptive anchor text with keywords

7. **External Linking**:

   - Include 2-3 links to authoritative sources
   - Set links to open in new tabs

8. **URL Structure**:

   - Keep URLs short and descriptive
   - Include primary keyword
   - Use hyphens to separate words
   - Example: /blog/voip-communication-tips

9. **Categories and Tags**:

   - Assign each post to a relevant category
   - Add 3-5 relevant tags

10. **Call to Action**:
    - Include a relevant CTA at the end of each post
    - Direct readers to related content or product pages
