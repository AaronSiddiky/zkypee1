# Zkypee Blog System

This directory contains the Zkypee blog system, designed for SEO optimization and easy content management.

## Directory Structure

```
/app/blog/
├── layout.tsx           # Blog layout with header and footer
├── page.tsx             # Main blog listing page
├── template.md          # Template for creating new blog posts
├── README.md            # This file
└── [post-slug]/         # Individual blog post directories
    └── page.tsx         # Blog post content
```

## How to Add a New Blog Post

1. Create a new directory under `/app/blog/` with a SEO-friendly slug:

   ```
   /app/blog/your-post-slug/
   ```

2. Create a `page.tsx` file in the new directory using the template from `template.md`.

3. Fill in the content following the structure in the template.

4. Add the blog post to the `blogPosts` array in `/app/blog/page.tsx`:

   ```javascript
   const blogPosts = [
     {
       id: "your-post-slug",
       title: "Your Post Title",
       excerpt: "A brief excerpt of your post (1-2 sentences)",
       date: "Month Day, Year",
       category: "Category Name",
       slug: "/blog/your-post-slug",
       image: "/blog/your-image.jpg",
     },
     // Other posts...
   ];
   ```

5. Add an image for your blog post in the `/public/blog/` directory.

## SEO Best Practices

### Metadata

Each blog post should include proper metadata:

```javascript
export const metadata: Metadata = {
  title: "Your Post Title | Zkypee Blog",
  description: "150-160 character description with primary keywords",
  keywords: "comma, separated, keywords",
  openGraph: {
    title: "Your Post Title | Zkypee Blog",
    description: "150-160 character description",
    type: "article",
    publishedTime: "YYYY-MM-DD",
    authors: ["Author Name"],
  },
};
```

### Content Structure

1. **Title (H1)**: Include your primary keyword near the beginning.
2. **Headings (H2, H3)**: Use proper heading hierarchy with keywords.
3. **Content**: Aim for 1,500+ words with primary keyword in the first 100 words.
4. **Images**: Include descriptive alt text with keywords.
5. **Internal Links**: Link to other relevant blog posts or pages.
6. **External Links**: Include links to authoritative sources.

### URL Structure

Use descriptive, keyword-rich slugs separated by hyphens:

- Good: `/blog/voip-communication-tips`
- Avoid: `/blog/post123` or `/blog/tips_for_voip`

### Categories and Tags

Assign each post to a relevant category and add 3-5 relevant tags to help with content organization and SEO.

## Image Guidelines

1. **Format**: Use WebP or JPEG for photos, PNG for graphics with transparency.
2. **Size**: Optimize images for web (typically under 200KB).
3. **Dimensions**: Use consistent dimensions (recommended: 1200×630px for featured images).
4. **Filenames**: Use descriptive, keyword-rich filenames with hyphens (e.g., `voip-communication-tips.jpg`).
5. **Alt Text**: Always include descriptive alt text with keywords.

## Publishing Workflow

1. Write the blog post following the template structure.
2. Review for SEO optimization (keywords, headings, links, etc.).
3. Add to the blog listing page.
4. Test locally to ensure proper rendering.
5. Deploy with the rest of the application.

## Analytics and Tracking

To track blog performance:

1. Monitor page views, time on page, and bounce rate.
2. Track keyword rankings for target terms.
3. Monitor backlinks to blog content.
4. Track social shares and engagement.

For any questions about the blog system, contact the development team.
