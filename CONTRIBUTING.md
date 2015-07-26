## How to contribute to the Noctua repository

Thank you for taking the time to contribute. We appreciate it!

There are two ways to contribute to this effort. The first way is to
use this project's [Issues Page](https://github.com/geneontology/noctua/issues), 
which we use as
a forum to discuss major (and soon minor) issues related to developing
the Noctua codebase. Examples of the type of issues that can be
submitted are:

* bugs
* feature requests
* data/library issues

A second way to contribute to the project is direct contribution of
development effort. Please refer to the next section,
[Contributions and Pull Requests](#pull_request), for more details.

<a name="pull_request"></a>
## Contributions and Pull Requests

The way to contribute development effort and code to the project is
via GitHub pull requests. GitHub provides a nice overview on
[how to create a pull request](https://help.github.com/articles/creating-a-pull-request).

Some general rules to follow:

* [Fork](https://help.github.com/articles/fork-a-repo) the main project into your personal GitHub space to work on.
* Create a branch for each update that you're working on. These branches are often called "feature" or "topic" branches. Any changes that you push to your feature branch will automatically be shown in the pull request.
* Keep your pull requests as small as possible. Large pull requests are hard to review. Try to break up your changes into self-contained and incremental pull requests.
* The first line of commit messages should be a short (<80 character) summary, followed by an empty line and then any details that you want to share about the commit.
* Please try to follow the [existing syntax style and conventions](#syntax_style)

TODO: Automated testing.

### Topic Branches

If you wish to collaborate on a new feature with other Noctua
developers, you can ask that a topic branch be created in this
repository. Since Github does not allow pull requests against branches
that do not yet exist, you will have to create an issue asking for the
topic branch to be created.

Once the topic branch exists, pull requests can be made against it in
the usual way. It may also be brought up to date with new changes
merged into master by anyone with commit access, if the changes
produce merely a fast-forward merge. However, if changes from the
master branch create a new merge commit, that commit needs to be
reviewed in a pull request.

Changes made in a topic branch can be merged into master by creating
and then [resolving in the normal way](#issue_resolution) a pull
request against the master branch.

<a name="issue_resolution"></a>
## Issue Resolution

Once a pull request or issue has been submitted, anyone can comment an issue to express their opinion. Users with the ability to manipulate the tags may also bump the "approval" tag to the next level (e.g. approval (1) -> approval (2)) or add the "dissent" tag. If an issue gets a dissent tag, there will be an attempt to reach consensus before resolving one way or the other. There isn't any strict time limit on a contentious issue. Silence is generally considered assent. The project will strive for consensus.

<a name="syntax_style"></a>
## Syntax Style and Conventions

TODO

- global variables (final user client vs lib)
- scope and for loops
- unit test types
  - behave
  - mocha/chai (non-chained)

preferred:

- emacs indentation
- CamelCase is generally frowned upon
- JSHint syntax checking (preferred profile in config/jshintrc)
