---
title: "Makefiles for C/C++ projects"
layout: blog
---

[In my last post about Makefiles]({% post_url 2019-11-18-makefiles-from-the-ground-up %}), we ended up with a simple Makefile that "compiles" our test `.in` files into intermediate `.mid` files, then "links" the intermediate files into a final output:

```make
INPUTS = $(wildcard *.in)
MIDS   = $(INPUTS:.in=.mid)
OUT    = out

$(OUT): $(MIDS)
	cat $^ > $@

%.mid: %.in
	cp $< $@
	echo MID >> $@

.PHONY: clean
clean:
	rm $(MIDS) $(OUT)
```

In this post, we'll replace the placeholder compilation and linking steps with real calls to a C or C++ compiler, then see how the Make program makes our lives easier.

Let's start with a project with only C source code, no C++ source code.

## Invoking the C compiler

I won't show any source files, but I'll assume you have some C code to compile. We'll start by swapping out the input and output file names. All we're really doing is changing what extensions we're expecting to see, and for clarity, I'm changing the variable names.

```make
CFILES   = $(wildcard *.c)
OBJFILES = $(CFILES:.c=.o)
OUT      = main
```

Now we can define our compilation and linking rules by calling out to `gcc`. You can choose to substitute `clang` or something else if you prefer, as long as it handles C source code. Note that I'm putting the name of the compiler in a variable because I use it multiple times:

```make
# CC stands for C Compiler
CC = gcc

$(OUT): $(OBJFILES)
	$(CC) -o $@ $^

%.o: %.c
	$(CC) -c -o $@ $^
```

At this point, the basic concept should be familiar, but let's summarize to make it crystal clear:

- When compiling from a `.c` file to a `.o` file, the base name should match. The compilation entails calling `cc` with the `-c` flag so only compilation (no linking) occurs. This way, each source file can be processed independently.

- To take these `.o` files and turn them into an executable, we have to process them all together. Linking entails calling `cc` with all the object files in the same command.

Finally, we should update our `clean` rule to use the new variable names. This entails just swapping out some variable names.

```make
.PHONY: clean
clean:
	rm -f $(OBJFILES) $(OUT)
```

### Adding compiler arguments

At this point, adding arguments to the calls to the compiler are straightforward, but I'll show the process for completeness. Instead of just writing out the arguments inline, however, I'll introduce some variables. We'll see later why these variables are useful.

```make
CC      = gcc
CFLAGS  = -Wall -I /additional/include/dir
LDFLAGS = -L /additional/lib/dir
LDLIBS  = -ldependency1 -ldependency2

$(OUT): $(OBJFILES)
	$(CC) $(LDFLAGS) -o $@ $^ $(LDLIBS)

%.o: %.c
	$(CC) $(CFLAGS) -c -o $@ $^
```

One reason the naming of these variables is useful is because tools like `pkg-config` uses the same terminology. For context, libraries you install system-wide can register themselves with `pkg-config`, and then you can pull out the necessary compile and link flags based on the library name. For example, to retrieve only the compile flags for a library known as `json-c`:

```make
# Add to the existing "C Flags"
CFLAGS += $(shell pkg-config --cflags json-c)
```

## Taking advantage about built-in rules

Let's take another look at the rule to compile C source code into `.o` files:

```make
%.o: %.c
	$(CC) $(CFLAGS) -c -o $@ $^
```

This is the type of rule that would be useful in many projects. There are enough variables that each project can customize the compilation process, for example by changing out the compiler, or passing different flags to the compiler. For this reason, (GNU) Make already contains this rule built right in! This is an example of an _implicit_ rule.

Practically, this means you can just remove the two lines above and everything will work just fine. Even the `CC` and  `CFLAGS` variables we defined will be honored, and even better, they have default values of `cc` and an empty string respectively.

The linking works similarly, but not quite the same:

```make
$(OUT): $(OBJFILES)
	$(CC) $(LDFLAGS) -o $@ $^ $(LDLIBS)
```

Make does contain this type of link rule, but there are two caveats:

- Without writing out a rule, Make doesn't know to create the final output file by default. This can be fixed by calling Make with the name of the output file (calling `make main` in this case) to have the implicit link rule take effect. Alternately, you can put `.DEFAULT_GOAL = $(OUT)` in your Makefile to tell Make which target to produce when called without an explicit target.

- The implicit rule is only defined for linking a single `file.o` file into an executable with a the matching name `file` (the same name as the object file, but without the `.o` extension). So, we need a way to tell Make that _all_ the object files need to participate in the linking.

To fix both of these problems, we can simply write out the link rule ourselves, but without a recipe:

```make
$(OUT): $(OBJFILES)
```

As long as _one_ of the object file dependencies has the same filename as the output file, then Make will substitute the correct recipe on its own. In this case, that means you need `main.c` to exist, so it can produce `main.o`, which then matches the specified output of `main`. Again, the `CC`, `LDFLAGS` and `LDLIBS` variables will be honored.

This leaves our final Makefile with mostly project-specific configuration and very little boilerplate:

```make
CFILES   = $(wildcard *.c)
OBJFILES = $(CFILES:.c=.o)
OUT      = main

CC      = gcc
CFLAGS  = -Wall -I /additional/include/dir
LDFLAGS = -L /additional/lib/dir
LDLIBS  = -ldependency1 -ldependency2

$(OUT): $(OBJFILES)

.PHONY: clean
clean:
	rm -f $(OBJFILES) $(OUT)
```

(Note: you can also omit the definition of the `CC` variable, as the `cc` executable should point to the system-default compiler anyway.)

## Building C++ projects

Compiling C++ files works similarly to compiling C files. There are implicit rules for compiling `.cc`, `.cpp` and `.C` files (all extensions recognized by GNU Make as C++ files) into `.o` files. A few new variables are used:

- The compiler used for C++ files is set using `CXX`, which defaults to `g++`. This is analogous to the `CC` variable.

- Flags are passed using the `CCXFLAGS` variable, instead of `CFLAGS`.

There's one major caveat, however. After a C++ file is compiled into a `.o` file, there's no indication from the file extension that it came from a C++ file. So, the implicit rule for linking still uses `CC` as the linker. The result is that the C++ standard library is not available. The two options are:

- Re-assign `CC` to `g++` (or to `$CXX`) so the C++ compiler is used for linking.

- Add `-lstdc++` to your `LDLIBS` in order to add the C++ standard library to the linking process.

An example Makefile for a C++ project may look like this, if you go with the option of adding the C++ standard library to the list of linked libraries:

```make
CPPFILES = $(wildcard *.cpp)
OBJFILES = $(CPPFILES:.cpp=.o)
OUT      = main

CFLAGS = -Wall
LDLIBS = -lstdc++ -lm

$(OUT): $(OBJFILES)

.PHONY: clean
clean:
	rm -f $(OBJFILES) $(OUT)
```

Notice how the Makefile is gathering up all `.cpp` files as inputs.

## Building hybrid C++ and C projects

Real-world C++ projects tend to use some C code, and there's one last issue when doing so. The problem is that C++ compilers typically _mangle_ symbols. For example, the types of arguments declared for a function are used in constructing the name of the function symbol in the object file. When the file using the symbol uses the mangled name but the file defining the symbol doesn't have the mangled name (as would be the case when calling a C function from a C++ file), the linking will fail.

One option is to re-assign `CC` to `g++`. Now, all C files will also be compiled with the C++ compiler, ensuring all symbols are mangled in the same way. However, this fails if you absolutely need to use the C compiler for a certain C file, or if you have object files that were already compiled from a C file using a C compiler earlier. These are not very common cases, but it could happen.

One solution is to use `extern "C" {}` blocks in your C++ code to ensure your C++ code refers to the unmangled names when necessary. I won't get into the details of this, but this is a useful tool to learn about.

Here's an example of a complete Makefile, using the first option of using `g++` as the C compiler and the linker.

```make
CFILES   = $(wildcard *.c)
CPPFILES = $(wildcard *.cpp)
OBJFILES = $(CFILES:.c=.o) $(CPPFILES:.cpp=.o)
OUT      = main

CC = g++

$(OUT): $(OBJFILES)

.PHONY: clean
clean:
	rm -f $(OBJFILES) $(OUT)
```

Notice we've defined two sets of inputs, then put them together to determine what the full list of object files should be.

## Dealing with header files

A major problem with the above approach is that header files are not taken into account. Because none of the implicit rules depend on any header files, changing a header file does not trigger a recompilation of the dependent implementation files. You can fix this by creating compilation rules for each source file, where each rule depends on the header files imported in that file. However, this is tedious to maintain. Instead, you can [have the compiler itself generate these rules for you](http://make.mad-scientist.net/papers/advanced-auto-dependency-generation/). Again, I won't get into this topic in this post.

---

It's good to understand how Make is designed to ease working with C and C++ projects. In fact, there are many such [built-in rules for other types of source files in GNU Make](https://www.gnu.org/software/make/manual/html_node/Catalogue-of-Rules.html#Catalogue-of-Rules), which use a variety of [implicit variables](https://www.gnu.org/software/make/manual/html_node/Implicit-Variables.html). Knowing these rules exist can make it easier to get a project up and running.

In reality, you may use a tool like Cmake instead of writing Makefiles directly. Still, Make is a common tool in the Unix ecosystem, and understanding it can help with portability and even debugging issues with Cmake-based projects.
