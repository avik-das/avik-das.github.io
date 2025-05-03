---
title: "LLMs are like compilers, sort of"
layout: blog
cover-img: /assets/images/2025-05-05-llms-are-like-compilers-sort-of/machines-ai-generated.jpg
thanks:
- Victor Huang
---

<figure markdown="1">
![An AI-generate image of two monitor-like things, one displaying text, the other displaying binary and other incomprehensible text. To the left of the first monitor are some speech bubbles.]({{ page.cover-img }})
<figcaption>An AI-generated image, appropriate for this post. The machine on the left is like an LLM, taking in prompts and producing code. The machine on the right is like a compiler, producing binaries. I tried really hard to generate a good image with AI, but my needs seem too esoteric. That's been my experience with AI coding too.</figcaption>
</figure>

I'm no expert on LLMs and coding with AI. In fact, I feel like I've fallen behind. I'm still in the initial phases of trying out AI-augmented coding. This blog post is my attempt at addressing my own reservations about this new world by comparing current AI to early compilers. The audience is myself, but maybe it'll help someone who's hesitant to use AI in their day-to-day coding.

Whenever I have a gut reaction against AI coding, I remind myself: **compilers faced the same backlash, but eventually, compilers (and high-level languages) enabled solving more complex problems faster, to the point of becoming indispensable tools.** With that in mind, I shouldn't dismiss AI coding.

As I sat down to write this blog post, I found someone else had already written a version of it: [When Compilers Were the 'AI' That Scared Programmers](https://vivekhaldar.com/articles/when-compilers-were-the--ai--that-scared-programmers/). I'll rehash some of Vivek's arguments, but Vivek is definitely pro-AI. I additionally want to explore another angle in my post.

## The complaints against are overblown

My initial reaction to AI coding could apply almost point-by-point to early compilers:

* LLMs produce bad code. "Bad" can mean inefficient, or even buggy. Early compilers also produced bad code. But compilers got better, and so will AI.

* You're giving up control. Same with (high-level) compilers, where you no longer decide exactly how your code maps to the actual execution on your machine. In exchange, you get to think about problems at a higher level, not worrying about… the execution on your machine.

* You lose out on understanding the fundamentals of your software, so when things go wrong, you can't fix it. For many people, being able to solve complex problems is more valuable than the few times when things go catastrophically wrong. Think scientists who are just trying to model something, and they don't actually care about being expert programmers or computer scientists. Meanwhile, for those of us whose core job is writing software, compilers haven't changed the fact that learning computer science and understanding low-level programming is still useful, hence the utility of a solid computer science degree.

In my time as a programmer, when the end goal was solving a problem, and writing code was just a means to an end, I reached for a high-level language. (Sometimes the constraints, such as writing for a specific hardware target, made that impossible, but I'm talking about software I'll run on my own computer or similar.) It's just more productive. Maybe I'll get to the point where I reach for an LLM.

As a side note: a lot of these same arguments apply to modern IDEs, with their fancy GUIs and auto-completion!

## The problem with LLMs: code is a liability

There is one fundamental difference I see with LLMs that I haven't seen addressed. The way AI coding works today is the LLM spits out code that you have to maintain. The original prompts are no longer the source of truth, the generated code is. When you fix a bug, the generated code is an input to the LLM, and the next iteration changes that code incrementally.

That's like saying the binary output of a compiler is what you check into source control. The binary is what you edit and the machine code is what you debug. But that's not how things work today. Today, the original source code is the source of truth. As compilers improve, you recompile the source code to produce a better binary. When you have a bug, you look for logical errors in the source code and modify that until the produced binary does what you want. This would be as if you stored only the LLM prompts, and you evolved the prompts incrementally, running the LLM from a blank slate each time you want to execute your software. (I'm ignoring incremental builds, but in general, a clean build is always possible with a compiler.)

One day, AI may become deterministic enough that we would indeed just store the prompts as our source of truth. Even compilers can be non-deterministic when performing optimizations, but as long as they preserve the semantics of the source code, we're okay with giving up full control over the machine code.

## Coding for fun

Given all this, you'd think I'm convinced I have to use LLMs all the time. After all, I wouldn't use a barebones text editor and start writing in assembly, right? I guess I'll always be an odd one out, because that's exactly something I like to do for fun! I've been [writing a compiler for over a decade]({% post_url 2025-01-01-reflecting-on-ten-years-of-my-personal-project %}), and there's a lot of assembly. In fact, there's a lot of hand-assembled machine code, and I like it that way. I typically use Vim, with minimal auto-completion and no "go to definition". Earlier in my career, I made it a point to make one of my work projects "Vim-friendly": if you couldn't keep the program in your head and navigate around the codebase by hand, the codebase was too complex.

So even in the 2020's, when you'd think compilers and IDEs are a given, I enjoy artisanal, hand-crafted code after all. Still, a tool is a tool, and I should learn how to use LLMs to enhance my code. I'm not ready to be left behind.
