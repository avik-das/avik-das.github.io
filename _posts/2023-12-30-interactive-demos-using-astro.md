---
title: "Interactive demos using Astro"
layout: blog
cover-img: /assets/images/2023-12-30-interactive-demos-using-astro/page-overview.png
---

This blog is mostly text and images, but I'm a big fan of adding interactive components to make my explanations more effective. See my post on [rendering curves in 3D]({% post_url 2020-09-08-rendering-curves-in-3d %}) as an example. For those interactive demos, the browser environment, with Javascript for the interactivity, is a fantastic delivery mechanism with wide reach and ease-of-use. Libraries like React make that easy, but a lot of the frameworks and tooling are built around the assumption that the end goal is a single-page app (SPA): the entire page is interactive, and page loads are handled by swapping out what's on the page. Think Next.js, or the Vue equivalent, Nuxt.

That's not the way I want my documents to operate. I'm not building web applications, just adding isolated interactive demos to an otherwise static medium. In the last year, I've discovered a great framework, [Astro](https://astro.build), that fits that exact niche. Usually, I prefer to avoid frameworks, but I have been happy enough with Astro to document my experience with it.

<figure>
  <img
    src="{{ page.cover-img }}"
    width="300"
    alt="A drawing of a web page, most of which does not use Javascript. There are two interactive demos that do use Javascript.">
  <figcaption>The ideal web page for linear, explanatory text with some interactivity sprinkled in</figcaption>
</figure>

## The Astro approach

This is going to sound a bit like I'm writing marketing copy for Astro, but honestly, I found it refreshing that Astro's philosophy aligned well with mine. Astro promotes content-heavy websites by rendering components on the server, then injecting only the necessary Javascript to make isolated "islands" of interactivity on the client side.

1. Astro allows you to use any Javascript component library (React, Vue, Svelte, Lit, etc.), or Astro's own component framework, to build a website. Regardless of what you choose, the Javascript is executed on the server to output static HTML. CSS pre-processors, like Sass, are also supported. The important piece is that **no client-side Javascript is shipped**. That means, unlike SPA frameworks, you get multiple pages with static HTML and CSS with links between them. At the same time, I still get to use components, allowing me to refactor common elements when coding.

1. When I use a third-party component library like React, I can optionally mark it as a client component. The component is still rendered on the server, but the component is "hydrated" (brought to life with Javascript) on the client. I can enable this when the page loads or when the server-rendered HTML for the component is scrolled into view (Astro uses the [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)). Either way, **only the Javascript needed to enable these client-side components are shipped to the browser**. This is the [Island Architecture](https://docs.astro.build/en/concepts/islands/). Note that it is possible to share state between islands, which I do in some limited cases.

(As a side note, I chose to use Astro components for anything server-only and Svelte for anything client-side. For my personal projects, I like Svelte's approach of using a compiler to emit targeted DOM updates, as if I were using JQuery or vanilla JS.)

Both of these pieces of functionality are ones I could build myself, which I appreciate conceptually. Doing so in a framework-agnostic way, with Typescript, hot reload, etc. are what Astro brings to the table.

## What I've built with Astro

Disclaimer: I haven't used Astro professionally, though I would totally consider it if I worked at a startup where content-heavy microsites are needed with minimal fuss. However, I have thoroughly enjoyed using Astro for two of my personal projects, both focused around teaching.

First, [Interactive Computer Science](https://cstheory.avikdas.com), where I discovered Astro. I like using common server components for a consistent visual treatment across the website, for definitions and study tips for example. The client components are reserved for the interspersed interactive exercises and visualizations. I had a lot of fun building a full Turing machine simulator and its associated UX. Best of all, I was able to utilize the interactive exercises in [my class]({% post_url 2023-07-17-my-two-semesters-of-teaching %})!

<figure>
 <img
   src="/assets/images/2023-12-30-interactive-demos-using-astro/turing-machine.png"
   width="500"
   alt="Screenshot from Interactive Computer Science, showing a running Turing machine with the current configuration of the machine highlighted">
 <figcaption>I used this Turing machine simulator as an interactive exercise during my lectures</figcaption>
</figure>

Second, [NES development on the web](https://nesdev.avikdas.com). This is another content-heavy project, but the interactive visualizations are promiment. In particular, I was able to embed a Webassembly-based 6502 assembler and an NES emulator to allow writing 6502 assembly code and have it run right in the browser! Outside of this use case, I'm also using client components for the type of interactive visualizations I wish I had when learning Gameboy Advance programming before college, things like visualizing bit fields and other low-level data representations.

<figure>
  <img
    src="/assets/images/2023-12-30-interactive-demos-using-astro/bit-representation-nesdev.png"
    width="400"
    alt="Screenshot from NES development, with a row of pixels at the top with various colors and their corresponding bit representations below">
  <figcaption>When learning about how graphics are represented on the NES, readers can change the top row and see the bottom rows update in realtime</figcaption>
</figure>

As with any framework, I have spent time wrangling Astro. But overall, Astro, Typescript, SASS and Svelte are all tools that have allowed me to focus on the content of my visualizations, not the infrastructure that powers them.

### Deployment/hosting

This part isn't specific to Astro, but if you ensure your server-rendered HTML is static (no per-user differences, no fetching data dynamically for each request, etc.), you can deploy to any host that supports static HTML. For my pet projects, I've been happy using [Fastmail's static website feature](https://www.fastmail.help/hc/en-us/articles/1500000280141-How-to-set-up-a-website). I could also have used Github pages of course.

## Why not convert this blog to Astro?

It really feels like my blog is the perfect fit for Astro. To be honest, I think so too and I'm tempted to rewrite the entire blog using Astro instead of Jekyll. I can get rid of a bunch of hand-rolled Javascript and fully utilize a UI library like Preact as a first-class citizen (instead of just pulling it in via a CDN).

For now, however, I'm going to hold off, for the same reason I'm wary about all-in-one frameworks in general. The more dependencies there are, the more complicated both development and maintenance becomes. As a practical example, I have an item on my to-do list to upgrade the interactive CS website to the latest Astro, something that's impeded on a conflict between the latest Typescript and the latest Astro. On the flip side, I feel like Jekyll, especially using it in conjunction with the default Github pages infrastructure, has been mostly set-and-forget. For my blog, I'm going to use "boring" technologies as much as possible. I want my blog to be [cold-blooded software](https://dubroy.com/blog/cold-blooded-software/).

And if it weren't for the sheer density of interactivity in my online teaching material, I would consider ditching Astro for those projects too. I've enjoyed Astro, but I wish I could use fewer dependencies.
