---
title: "Reflecting on ten years of my personal project"
layout: blog
cover-img: /assets/images/garlic-logo.png
---

<figure markdown="1">
<img src="{{page.cover-img}}" width="192" height="256" alt="Parentheses forming the shape of a garlic clove, with the word Garlic written underneath">
<figcaption>The Garlic logo</figcaption>
</figure>

On April 12, 2014, I wrote a [quick and dirty interpreter](https://github.com/avik-das/garlic/blob/6aabfdd65bf585202948586215e0e3618cd91a17/s-expr.rb) for a Scheme-like language. In the next week, I ripped out that code and laid the foundation for the compiler I've been working on for almost eleven years! I didn't have time to reflect on it at the time of the ten-year anniversary, so I'm writing my thoughts down now.

The language and its compiler are called Garlic, a name I'll talk about later.

## Why write a compiler?

Ultimately: because I enjoy it.

In college, I took a class on compilers with a close friend. We didn't do well on the second project---static analysis---partly because it was a hard project and partly because we had little time with all the other classes we were taking. The third project---native code generation---was due the week between classes and finals, allowing us to put in extra time. We did amazing on that project. Even with that success, there were many enhancements we didn't have time for. I remember implementing integers as objects on the heap, while another student used [tagged pointers](https://en.wikipedia.org/wiki/Tagged_pointer), resulting in a significant speedup in our (admittedly contrived) test programs. I knew I wanted to spend more time in this domain.

That explains why I chose a Scheme-like language, as parsing would not be a significant effort, and I could focus on the code generation. That said, I did want to revisit the static analysis too. Almost two years after graduation, meaning almost three years after the compilers class, I finally sat down to pick up compilers again.

At this point, my motivation comes down to:

1. **Learning**. A one-semester class can only go so deep. The class is also (rightly) focused on fundamental concepts, less so on the specifics of individual architectures or file formats.

2. **Exploring** different design decisions, instead of picking one and implementing it due to time pressure.

3. **Challenging** myself.

## Phase one: the Ruby implementation

I chose to write Garlic in Ruby, hence the name **G**arlic's **A** **R**uby **L**isp **I**mplementation **C**ompiler. The name wasn't chosen until almost exactly a year later, and until then, even the repo was simply `scheme-compiler`.

Ruby is a language I enjoy using and this is my personal project. The tech stack for the main implementation still looks like this:

- Ruby as the compiler implementation language.

- A mix of C and x86-64 assembly for the runtime. This code is not executed during compilation.

- The [Parslet library](https://kschiess.github.io/parslet/) for parsing. Told you I didn't want to spend much time on the parsing!

- The compiler outputs x86-64 assembly _as text files_ that are then fed into GCC or Clang. Those compilers handle the remaining steps of compiling any additional C code, linking everything together and producting an executable file.

The choice to rely on a C compiler and linker was based on what we did in my compilers class. To be fair, in other classes, I'd written an assembly-to-opcode assembler, so the compilers class was more about focusing on the parts we hadn't learned before.

As I added more features to the compiler, I ran into some interesting challenges. Some of these do assume some knowledge about compilers to understand.

### The `garlic_fncall` helper

Objective-C is famous for its `objc_msgSend` function, a tightly-optimized piece of code underlying the entire message passing objected-oriented nature of the language. Mike Ash, one of the premier experts in the Mac development ecosystem, wrote multiple articles about this function, including [Let's build `objc_msgSend`](https://www.mikeash.com/pyblog/friday-qa-2012-11-16-lets-build-objc_msgsend.html). Every method call in the language goes through this function.

I ended up with a similar design, calling my version `garlic_fncall` (initially `scm_fncall` before the name change). I think the idea of having shared code coordinate function calls is a common paradigm. For example, in other object-oriented languages, there might be some common code to look up method implementations in a virtual table, allowing for features such as inheritence. My version also went through many iterations, adding support for variadic functions, optimizing the code and eventually allowing the calling of user-defined C-code!

### Stack alignment on x86-64

One of the real-world problems I ran into was the stack alignment needed to follow the [System V Application Binary Interface (ABI)](https://gitlab.com/x86-psABIs/x86-64-ABI). An ABI defines, among other things, a _calling convention_, rules for how functions are called and what the called functions can expect from their callers. Because the generated code interfaces with code produced by other compilers, I need to follow these conventions to ensure compatibility.

One requirement is to ensure, when a function call is made using the `call` instruction, the stack needs to be aligned to a 16-byte boundary. There's a catch, in that the call needs to be made with the stack alignment offset by 8 bytes, because the return address will be pushed to the top of the stack. The stack has to be aligned *after* the return address is pushed!

When testing on my Linux machine, I ignored this requirement and had no problems. When I tried the compiler on a Mac, the tech debt finally caught up to me. The commit history doesn't convey the hair-pulling that ensued as I tried to patch the issue incrementally. Finally, I figured out a [general approach](https://github.com/avik-das/garlic/commit/e7b83283c1942500ff1e50ba701a2304a076a7e5) that has served me well since then. In retrospect, the solution is easy, so maybe I just didn't have enough years of experience back then.

### Designing and implementing modules

This was a fun excursion. Instead of looking at the landscape of Scheme implementations at the time, I asked myself what kind of code _I_ wanted to write to define a library or module for reuse, and what the consequences would be for code generation. Certainly, some of this was influenced by my work with Node.js at the time. With that in mind, a few months into the project, I added [module support](https://github.com/avik-das/garlic/commit/d857e4a5aa1e68f79fc88392782fbc44dc6306bc). Here's how it looks:

```scheme
; I can write any code I want in the module
(define var-1 ...)
(define (fn-2 ...) ...)

; Then choose what to export. I don't have to export everything.
(module-export
  var-1
  fn-1)
```

And in the consumer module:

```scheme
(require "my-module")

(my-module:fn-1 my-module:var-1)
```

Because this was my pet project, I was chose to explore some interesting quality-of-life functionality: the ability to import symbols into the global namespace and renaming modules as I import them. The most interesting part was using my chosen syntax to enable analyzing what symbols are available throughout the program and providing clear error messages when a symbol is not defined or visible. I felt especially proud of this part because catching references to undefined symbols was an area of much frustration during my college class.

### Calling into C code

Aside from the C code in the language runtime, I also added support for defining your own Garlic functions in C. The original implementation used a different syntax, using `ccall` to indicate calling a C function. In turn, the compiler generated different code for calling a Garlic function versus calling a C function. Eventually, I was able to unify the syntax, making it as easy to call a Garlic function written in C as it was to call a Garlic function written in Garlic.

To achieve this, I had to think about developer ergonomics, as well as make some general improvements to my code. One minor improvement was to ensure I was truly following the System V ABI, including passing arguments on the stack in reverse order. The idea was to call Garlic-native functions in the same way you would call a C function.

Still, there were going to be differences in how Garlic-native and C functions were going to be called, hence the `ccall` syntax. What I finally landed on was to statically analyze the C code to understand what functions it would export, and use that information to create wrappers around only those functions to set up a little bit of extra code when calling those functions. This eliminates the `ccall` syntax because the developer no longer needs to explicitly indicate they are calling a C function. The trade-off is that the way I have to analyze the C code is limited, forcing developers to write their exports without comments or pre-processor macros. For example, here's what my string module exports look like in C:

```c
garlic_native_export_t string_exports[] = {
    {"null?", nullp, 1},
    {"concat", garlic_internal_string_concat, 0, 1},
    {"concat-list", concat_list, 1},
    {"string-tail", string_tail, 2},
    {"symbol->str", symbol_to_str, 1},
    {"string=?", string_equalp, 2},
    {"at", character_at, 2},
    {"downcase", downcase, 1},
    0
};
```

I'm happy with this trade-off, as it enables effective static analysis.

The other design decision I needed to make was the API I exposed to the C code. I pulled on my knowledge of famous C APIs, like in the Ruby and Python worlds, and I've been happy with the ergonomics of writing C extensions. You can see the [full C API](https://github.com/avik-das/garlic/blob/ac5654a3128f30d8147e923c26652486a08ab9a9/stdlib-includes/garlic.h) at the time of writing.

## Phase 2: the meta-circular implementation

A year-and-a-half into the project, I was happy with the ability to write interesting programs, like a [little web page](https://github.com/avik-das/garlic/blob/308e0bcb72fb4ef715e637fb3e2727c465e04042/http-test/server.scm) served by an embedded web server ([C wrapper around microhttpd](https://github.com/avik-das/garlic/blob/c51c18e2d0d819037a91cf2098951c476e9b384b/stdlib-includes/http.c), [HTML generation library in Garlic](https://github.com/avik-das/garlic/blob/308e0bcb72fb4ef715e637fb3e2727c465e04042/stdlib-includes/html.scm)).

I wanted the next step of the compiler journey to be macro support, the ability to run Garlic code _at compilation_ time to more easily extend the language. Unfortunately, I realized this would mean either creating a parallel interpreter for the language to run during compilation or finally emit raw machine code instead of assembly text. The latter sounded more appealing, but it would be a large effort. December 2015, I decided that instead of re-implementing the code generation within the Ruby implementation, I might as well rewrite the entire compiler in Garlic! That was the start of the [recursive compiler](https://github.com/avik-das/garlic/commit/0b0a28b01f355eb8ebafb69d315e0b4ca92552c1). I promptly neglected the project for almost two years after.

Since then, however, I have been putting my focus into this re-implementation. The goal is to rename the project to **G**arlic's **A** _**R**ecursive_ **L**isp **I**mplementation **C**ompiler. In the process, I've learned a lot.

### Crafting a usable language

One goal I had for Garlic was to make a language that was useful for writing real programs. The language would never be used at a company trying to make money, but I wanted to use the language personally for more than just one-off test programs. Writing a compiler is a bit of code, and it has some interesting I/O, string manipulation and data processing. All of that means the implementation language should be expressive enough to handle the complexities in this domain.

To that end, I've found gaps in the language that, when implemented, added significant expressivity into the language. The one I'm most proud of is destructuring assignments, allowing me to write code like:

```scheme
(let ((a . b) (fn-returning-pair))
  (if (> a b) a b))
```

This is super useful for the types of complex data processing needed in a compiler, as it allows for passing around multiple values easily.

I've also extended the standard library to include string and file processing. However, both in terms of language features and standard library functionality, I've tried to avoid throwaway work:

- Any language features I want have to be added to the Ruby implementation. I will have to reimplement that feature in Garlic later.

- Any standard library function I write in C _may_ need to be rewritten in Garlic, "somehow". This depends on whether I end up reimplementing C module support, but without relying on GCC or Clang, I'm not sure what my plan is.

Still, I'm proud of the language I've created, because in my experience, it's good enough to write code that wrangles the complexity of writing a compiler.

### ELF file generation

Removing the dependency on an existing C compiler means I needed to output an executable that my operating system can load and run. On Linux, this meant constructing an Executable and Linkable Format (ELF) file. In turn, that meant I needed to understand the structure of an ELF file inside and out.

In the first half of 2023, I put some work into understanding ELF files. I didn't make any commits to the compiler during that time, but two big artifacts from that time are:

- A way to generate a reference, minimal ELF file [byte-by-byte](https://github.com/avik-das/garlic/blob/1632510c1a4a605a9ccb5ab23fbec1f3e78b2e19/recursive/elf-exploration/write-elf.rb).
- An [interactive visualization](https://scratchpad.avikdas.com/elf-explanation/elf-explanation.html) of those bytes (not very mobile friendly, unfortunately).

These artifacts were invaluable as I dropped and picked up the project over the course of the next year. With this understanding in hand, I was finally able to create a library to generate these files when given some machine code as the contents:

```scheme
(require "./elf-x86-64-linux-gnu" => elf)
(require file)

(define test-code
  '(0x48 0xc7 0xc0 0x3c 0x00 0x00 0x00 ; mov  $60, %rax
    0xbf 0x2a 0x00 0x00 0x00           ; mov  $42, %edi
    0x0f 0x05))                        ; syscall

((compose
   (lambda (b) (file:write-bytes "generated-elf" b))
   (lambda (e) (elf:emit-as-bytes e))
   (lambda (e) (elf:add-executable-code e 'main test-code)))
 (elf:empty-static-executable))
```

The idea is the machine code will be generated by the code generation module, leaving very little boilerplate to actually wrap that machine code into an executable. Since then, I've even been able to dynamically generate the code and the ELF file generator makes that code executable!

The reason this functionality was so difficult is because ELF files contain many cross-references between different parts of the file. It's not possible to generate an ELF file in one pass, as references between sections have to be resolved, and those resolutions depend on the size and contents of the other sections in the file. I'm very proud of having cracked this problem, and that too in Garlic code that I find understandable. (We'll see how I feel when I come back to this code after a break!)

### Better error messages

An unexpected benefit of the rewrite was creating infrastructure for better error reporting than even the original Ruby implementation supported. It wouldn't be hard to improve the error handling in the Ruby implementation, since Parslet gives the necessary information should I choose to use it. However, I'm proud I was able to pass around the necessary information about lines and columns _within my hand-written lexer/parser_. See this beautiful error report:

```
Compilation failed (2 errors)

  ERROR: undefined variable 'undefined-variable' (test-errors.scm:2:10)

    2| (display undefined-variable)
       ---------^

  ERROR: undefined variable 'undefined-variable-again' (test-errors.scm:4:10)

    4| (display undefined-variable-again)
       ---------^
```

I definitely took inspiration from modern languages like Rust here.

## Looking forward to the future

With a flurry of activity in the last few days, I'm happy with the progress I've made. I hope Garlic will be a lifelong project for me, and I don't know if I'll ever call it finished. Some of the things I see in the future:

- Obviously, finish the code generation. I'll have to think about problems like dynamic linking and relocatable code for any of this to be scalable. That said, I'm excited at the possibility of making Garlic support low-level programming to avoid the need for C-based scaffolding.

- Finally adding macro support.

- Retiring the Ruby implementation once the recursive implementation is finished.

- Maybe one day writing a hobbyist operating system and using Garlic as the system language?

Until then, I'll keep hacking away at this project that has occupied over a decade of my life.
