import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Zkypee | Best Skype Alternative & Free Replacement",
  description:
    "Learn how Zkypee became the best Skype alternative and free Skype replacement as Skype is shutting down. Our mission is to provide better communication tools for everyone.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">
        About Zkypee - The Best Skype Alternative
      </h1>
      <div className="max-w-3xl space-y-6">
        <p className="text-lg">
          Welcome to Zkypee, the <strong>best Skype alternative</strong> for
          anyone looking for a reliable communications platform. With Skype
          shutting down many of its services and features, we created Zkypee as
          the perfect <strong>free Skype replacement</strong>.
        </p>

        <h2 className="text-2xl font-semibold mt-6">
          Why Choose Zkypee as Your Skype Alternative?
        </h2>

        <p>
          As long-time Skype users ourselves, we were disappointed with the
          direction Skype was taking. We created Zkypee to preserve what people
          loved about Skype while improving on its weaknesses. Our mission is to
          connect people through seamless and reliable technology, making
          communication accessible to everyone.
        </p>

        <p>
          Founded in 2023, we have been working tirelessly to develop
          cutting-edge tools that enhance how people connect and collaborate. As
          the perfect <strong>Skype shutting down alternative</strong>, we offer
          all the features you relied on with Skype, plus many improvements.
        </p>

        <h2 className="text-2xl font-semibold mt-6">
          Zkypee vs. Skype: The Better Choice
        </h2>

        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>More affordable international calling rates</li>
          <li>Seamless transfer of your existing Skype credits</li>
          <li>Improved call quality and reliability</li>
          <li>Modern, intuitive interface</li>
          <li>Enhanced security and privacy features</li>
          <li>Regular updates and new feature releases</li>
          <li>Dedicated customer support</li>
        </ul>

        <p className="mt-6">
          Don't let Skype's shutdown disrupt your communications. Make the
          switch to Zkypee today and experience the best{" "}
          <strong>free Skype replacement</strong> available.
        </p>
      </div>
    </main>
  );
}
