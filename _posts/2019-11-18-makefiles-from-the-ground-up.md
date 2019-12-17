---
title: "Makefiles from the ground up"
layout: blog
---

When I first started using Makefiles to build software projects, I often copy pasted from examples I found. I also assumed the Make tool worked like other build systems I had used, like Maven or Gradle in the Java world. While both approaches helped me learn the tool, it took me some time to really understand Make and how to take advantage of its unique features.

In this article, I will walk through the creation of a simple Makefile from scratch, explaining each concept being added to the Makefile. By the end, the goal is to understand the fundamentals of how Make operates. This post assumes the use of the GNU version of Make, a specific implementation, and therefore some of the syntax is not applicable to other implementations. However, the basic concept of a file-based dependency structure still applies to Make in general.

I am by no means an expert on Make, so I'm happy to receive feedback on how I could achieve what I've done more efficiently!

## Generating output files from input files

The primary purpose of Make is generate a set of output files from a set of input files. 

Start by creating some input files. In a C project, these would be your C source files. For now, just create some plain text files with the `.in` extension as an illustrative example. Make sure to include some distinctive text to tell them apart later.

```sh
$ echo 'File a' > a.in
$ echo 'File b' > b.in
$ echo 'File c' > c.in
```

In our toy example, we'll "compile" these `.in` files into `.mid` files, then "link" them together into a final file called `out`. This would be like compiling C source files into `.o` object files and then linking them together into an executable.

Now, create a file called `Makefile`. The first _rule_ we'll put in our Makefile is to say that the final output consists of the text of all our `.mid` files concatenated together. Note: ensure you use tabs for indentation, as that's what Make expects.

```make
out: a.mid b.mid c.mid
	cat a.mid b.mid c.mid > out
```

A rule consists of three parts:

1. The _target_, which in this case is `out`. This tells Make what the output of the rule is, the file we want to generate.

1. The _prerequisites_ come after the colon, telling Make what files need to be present for the target to be generated. This way, this rule is only run when all the necessary input files are present. Furthermore, the rule will only run if at least one of the prerequisites has been modified later than the target. This prevents unnecessary re-compilations.

1. The _recipe_, a series of commands that specify how to transform the prerequisites into the target. In this case, we're simply concatenating the `.mid` files into one file.

Now, you can ask Make to generate `out`, which is the output we want. However, that will fail:

```sh
$ make out
make: *** No rule to make target 'a.mid', needed by 'out'.  Stop.
```

The problem is clear: there's no file called `a.mid`, so there's no way to execute the rule we defined. The solution is to define exactly how we can generate `a.mid`. To do this, we define another rule:

```make
out: a.mid b.mid c.mid
	cat a.mid b.mid c.mid > out

a.mid: a.in
	cp a.in a.mid
	echo MID >> a.mid
```

Here, we're simulating "compiling" `a.in` into `a.out` by just copying over the input and appending some text at the end. Now if you ask Make to generate `out`, you will see that Make automatically generates `a.mid` first. But again, there's a failure:

```sh
$ make out
cp a.in a.mid
echo MID >> a.mid
make: *** No rule to make target 'b.mid', needed by 'out'.  Stop.

$ ls
a.in  a.mid  b.in  c.in  Makefile

$ cat a.mid 
File a
MID
```

The `a.mid` intermediate file is generated correctly, but now Make complains about `b.mid` being missing. At this point, we can fill in the remaining rules:

```make
out: a.mid b.mid c.mid
	cat a.mid b.mid c.mid > out

a.mid: a.in
	cp a.in a.mid
	echo MID >> a.mid

b.mid: b.in
	cp b.in b.mid
	echo MID >> b.mid

c.mid: c.in
	cp c.in c.mid
	echo MID >> c.mid
```

Now, running `make out` generates the remaining `.mid` files, then finally generates the `out` file:

```sh
$ make out
cp b.in b.mid
echo MID >> b.mid
cp c.in c.mid
echo MID >> c.mid
cat a.mid b.mid c.mid > out

$ ls
a.in  a.mid  b.in  b.mid  c.in  c.mid  Makefile  out

$ cat out
File a
MID
File b
MID
File c
MID
```

Notice that `a.mid` was not generated again. This is because `a.mid` already existed, and it was newer than its prerequisite, `a.in`. So, there was no need to re-generate it!

## Using patterns and variables to avoid repetition

The first part that should stick out is how the "compilation" rule is being repeated again and again, despite looking almost the same. We can fix this! The solution is to use a _pattern rule_.

In this case, we want to generate a particular `.mid` file from its corresponding `.in` file, as long as the prefix of both the input and the output match. We can use `%` to reference that prefix. The pattern is used in both the target and the prerequisites in order to tie them together.

Now, with a placeholder in the target and prerequisites, we need a way to reference the actual files in the recipe. To do this, we use two _automatic variables_ defined by Make:

- `$<` is the name of the _first_ prerequisite. Because we only have one prerequisite, this will suffice, but we'll see later how to deal with more prerequisites.

- `$@` is the name of the target.

With these pieces in place, we can replace the three "compilation" rules with a single pattern rule:

```make
out: a.mid b.mid c.mid
	cat a.mid b.mid c.mid > out

%.mid: %.in
	cp $< $@
	echo MID >> $@
```

To test this out, we need to remove the `.mid` files (and for good measure, the `out` file) before running `make out`:

```sh
$ rm *.mid out

$ make out
cp a.in a.mid
echo MID >> a.mid
cp b.in b.mid
echo MID >> b.mid
cp c.in c.mid
echo MID >> c.mid
cat a.mid b.mid c.mid > out

$ ls 
a.in  a.mid  b.in  b.mid  c.in  c.mid  Makefile  out
```

## Automatically inferring source files

There's still some repetition in our rule for generating the `out` file. To clean up this repetition, I'll introduce a few concepts that will come in handy down the line:

1. First, we can infer what all our source files are by using the `wildcard` function. Using the function, we'll define a top-level variable `INPUTS`, consisting of all the `.in` files in our directory.

1. Next, we construct a list of all our `.mid` files by using _substitution references_ to replace the `.in` extensions in our input file list with the `.mid` extension. This is used to define a variable `MIDS`.

1. Finally, we can use `MIDS` as our prerequisites for the rule generating `out`, using `$^` in the recipe to reference all the prerequisites. This is similar to our use of `$<`, but instead of referencing the first prerequisite, we reference all of them.

Just for good measure, we also abstract out the name `out` into its own variable. This will come in handy in the future.

```make
INPUTS = $(wildcard *.in)
MIDS   = $(INPUTS:.in=.mid)
OUT    = out

$(OUT): $(MIDS)
	cat $^ > $@

%.mid: %.in
	cp $< $@
	echo MID >> $@
```

Again, to test the latest Makefile, remove all the generated files before running `make out`:

```sh
$ rm *.mid out

$ make out
cp a.in a.mid
echo MID >> a.mid
cp b.in b.mid
echo MID >> b.mid
cp c.in c.mid
echo MID >> c.mid
cat a.mid b.mid c.mid > out

$ ls 
a.in  a.mid  b.in  b.mid  c.in  c.mid  Makefile  out
```

Success! Now, if you wanted to, you could add a new file, `d.in`, and you wouldn't have to change the Makefile at all.

## Rules that don't generate files

It's quite annoying to manually remove the generated files. For that reason, it's common to include a "clean" rule that removes any files generated by the build. However, such a rule doesn't generate any new files, so what do we specify for the target? Well, we can simply specify `clean`, and then mark that rule as _phony_ to specify it does _not_ generate a file named `clean`.

To define this rule, we can now make use of the `MIDS` and `OUT` variables we defined above to automatically determine what files to remove. The recipe for this rule will simply `rm -f` the files, using the `-f` flag to ensure an error is not raised if one of the files does not exist yet.

```make
.PHONY: clean
clean:
	rm -f $(MIDS) $(OUT)
```

Test it out from the previous state, when all the intermediate files existed:

```sh
$ ls 
a.in  a.mid  b.in  b.mid  c.in  c.mid  Makefile  out

$ make clean
rm b.mid a.mid c.mid out

$ ls
a.in  b.in  c.in  Makefile
```

In a sense, a dependency-graph-based build system, like Ant or Gradle, only provides phony tasks. You define what steps a build should take, and how to run those steps. Make is similar, but it primarily defines those steps based on the files generated at each step. The advantage of Make's approach is only steps where the output is out-of-date compared to the inputs need to be re-run. The disadvantage is that the more granular steps make most sense for certain types of languages Make was designed for, like C.

## Final Makefile

All of the above leaves us with the final Makefile:

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

Each part of the Makefile serves a purpose, and that purpose should make sense given the way we've built up the Makefile. In a later post, I will talk about how Make simplifies the process of building certain types of projects, namely C projects.

Until then, feel free to read [the excellent GNU Make manual](https://www.gnu.org/software/make/manual/html_node/index.html). Keep in mind, however, that manual technically documents the GNU version of Make. That means certain documented features are not available in the default Make utility installed on macOS or on BSDs.

_UPDATE: [you can now read about using Make to build C and C++ projects]({% post_url 2019-12-16-makefiles-for-c-cpp-projects %})._
