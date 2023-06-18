Personal website - Avik Das
===========================

Quick Start
-----------

This website is built with [Jekyll](https://jekyllrb.com/) and is suitable for deploying to [Github Pages](https://pages.github.com/).

To develop locally:

```sh
git clone https://github.com/avik-das/avik-das.github.io.git
cd avik-das.github.io

# Set up your rbenv if you wish
#
#   rbenv install 3.2.1
#   rbenv local 3.2.1
#   echo '.ruby-version' >> .git/info/exclude

# Or otherwise sure you're using a suitable new version of Ruby

gem install bundler
bundle

bundle exec jekyll serve

# Or, what I actually use for development:
#
# - Use the included live reload functionality
# - Compile drafts from the _drafts folder and include them in the index
# - Compile posts with dates in the future
# - Allow connections from external machines
bundle exec jekyll server \
  --livereload \
  --drafts \
  --future \
  --host 0.0.0.0
```

Now you can edit the website, and the website will be automatically re-generated.

While Github Pages will automatically build the website when new commits are pushed, you may want to create a statically-built version to deploy on other hosts. To do so:

```sh
bundle exec jekyll build
```

This will build the website into `_site`, just like `jekyll serve`, but will do so only once.
