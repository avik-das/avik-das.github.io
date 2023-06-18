source 'https://rubygems.org'

# This website will be deployed on Github Pages, with Github's default build
# process (as opposed to building the static files locally and uploading them
# to Github).
gem 'github-pages', group: :jekyll_plugins

group :jekyll_plugins do
  gem 'jekyll-feed', '~> 0.15.1'
  gem 'kramdown-parser-gfm', '~> 1.1.0'
end

group :development do
  # As per https://github.com/jekyll/jekyll/issues/8523 webrick is no longer
  # a bundled gem in Ruby. Jekyll, at least the version provided by
  # github-pages, does not declare webrick as a dependency either. Declare it
  # manually as a workaround.
  gem 'webrick'
end
