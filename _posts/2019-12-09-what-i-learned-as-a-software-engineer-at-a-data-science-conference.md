---
title: "What I learned as a software engineer at a data science conference"
layout: blog
---

Last week, I had the pleasure of attending and speaking at [PyData LA 2019](https://pydata.org/la2019/). Coming from a software engineering background, I learned some things data scientists may consider basic, but it was a fantastic experience all around. Here's what I learned.

## Tools of the trade

<figure markdown="1">
![Logos for the tools mentioned below](/assets/images/2019-12-09-what-i-learned-as-a-software-engineer-at-a-data-science-conference/tools.png)
</figure>

Even though I know data science concepts, I didn't know all the tools scientists use daily.

**My key insight is the data science community has created tools that are easy to use for beginners and experienced folks alike.** We software engineers often gravitate toward complex tools because we put too much emphasis on the code we write, not the business problems we're solving.

- **There are many Python libraries for running complex algorithms easily.** [PyTorch](https://pytorch.org/) allows running deep learning algorithms on the GPU transparently, and [Dask](https://dask.org/) makes it easy to scale familiar data science libraries across distributed environments. [GeoPandas](http://geopandas.org/) is geared toward geospatial data, and [NetworkX](https://networkx.github.io/) implements graph algorithms. All these tools have great, beginner-friendly tutorials without compromising on their power.

- **[RAPIDS](https://rapids.ai/) is a suite of tools and drop-in replacement libraries that allows running existing and new Python code directly on the GPU.** One cool component is cuGraph, which is like running NetworkX with GPU acceleration!

- [Bokeh](https://docs.bokeh.org/en/latest/index.html) makes it easy to create interactive visualizations, and [HoloViews](http://holoviews.org/) takes the concept further by being _data-oriented_. By giving up control on exactly how data is rendered, **it's possible to explore data before you even know what it's supposed to look like**.

- [Jupyter notebooks](https://jupyter.org/) are a tool for mixing code and prose for both exploratory data science, as well as communicating the results with others. [Binder](https://mybinder.org/) packages up an existing Github repository with notebooks for running the notebooks on the cloud, and [Google Colab](https://colab.research.google.com/) also has similar functionality. **These two tools allowed me to participate in the interactive tutorials without installing anything!**

## Freely-available data sets

Data science is nothing without data, and it's possible to get started with extensive data sets that are freely-available.

- [The Common Objects in Context (COCO) data set](http://cocodataset.org) provides large amounts of training and testing data for computer vision applications. The data is expansive, well-labeled, and [easy to explore interactively](http://cocodataset.org/#explore).

- There is a wealth of public data useful for tackling homelessness. [The U.S. Department of Housing and Urban Development](https://www.huduser.gov) publishes data at the national level, and both [Los Angeles](https://data.lacity.org/) and [San Diego](https://data.sandiegodata.org/) publish regional data.

- [NASA also has extensive data sets available](https://earthdata.nasa.gov/eosdis/daacs), full of global geospatial data.

- [There exists an online encyclopedia dedicated to e. coli](https://ecocyc.org/), one of the mostly widely studied model organisms!

## Deployment and productionization

Easy to use tools aren't always easy to put into production, but the data science and software engineering communities have come together to produce useful tools in this domain.

- [JupyterHub](https://jupyter.org/hub) allows sharing Jupyter notebooks by installing the hub software on public cloud servers. This reduces the gap between the exploration phase and the reporting phase.

- [MLflow](https://mlflow.org/) makes it possible to run data science pipelines in a reproducible way, tracking the execution progress and resulting artifacts through a web UI.

- **[Kedro](https://kedro.readthedocs.io/en/latest/) brings software engineering principles to data pipelines** by abstracting out data sources and configuration, and by allowing declarative specification of dependencies between different parts of the pipeline. When used together, MLflow and Kedro seem to address a similar scope to [LinkedIn's Azkaban](https://azkaban.github.io/) tooling for Hadoop.

- **Simplicity is underrated.** Even though Python is slow, Ancestry.com simplified a complex Hadoop pipeline and replaced it with a lightweight event-based system written in Python. Because the core computations are still done in lower-level languages, the lower overhead of the simpler Python coordination layer greatly sped up their data processing pipelines. Furthermore, it was easier to share code between the Python-centric research group and the production engineering group.

- [Ten Simple Rules for Reproducible Research in Jupyter Notebooks](https://arxiv.org/abs/1810.08055) is a paper outlining how to share data science research in a way that others can truly build off of.

## What's the state of the art in data science/machine learning?

In addition to learning about tools, I attended talks about general concepts to see where the data science field is headed next.

- In **computational biology**, Gene Regulatory Networks (GRNs) are directed graphs capturing interactions between molecular regulators that determine which genes are expressed from the same genetic code. This is what allows different cells in our bodies to behave differently despite having the same DNA inside them. Because GRNs are graphs, common graph algorithms like clustering and connectivity analyses yield interesting insights.

- While statistics and linear algebra are two fields of math most commonly used for machine learning, **[one group is applying topology in the form of UMAP](https://github.com/lmcinnes/umap)**. By exploiting the underlying math, the team is able to perform dimensionality reduction more performantly than with previous techniques.

- Hyperparameters are parameters of a model are set prior to training, instead of being learned. These hyperparameters still affect the performance of a model significantly, and randomly trying out hyperparameters has historically been an effective way to tune them. **UC Berkeley's RISE Lab has released more advanced tuning techniques**, along with [a framework-agnostic library that makes hyperparameter tuning easy to add to your training](http://tune.io). (Related to an earlier point, I think it's incredible cool you can try out this library via Colab, without having to install anything!)

- **Modern deep learning models are hard to reason about due to their complexity.** [LIME](https://arxiv.org/abs/1602.04938) and [Anchors](https://homes.cs.washington.edu/~marcotcr/aaai18.pdf) are two techniques that decompose predicted inputs in order to determine what features of the input the model is actually basing its decision on. [SEARs](https://homes.cs.washington.edu/~marcotcr/acl18.pdf) and [Universal Adversarial Triggers](https://arxiv.org/abs/1908.07125) attempt to construct incorrectly-predicted inputs in order to find bugs in the model. All these approaches underline the importance of properly validating your model!

## You can play around with Quantum Computing today

While I had read up on the basics of quantum computing, I didn't know how I could play around with it today. I learned how:

- Computations are represented as circuits of qubits (the quantum computing equivalent of classical `0`/`1` bits), gates to combine qubits and measurements to extract data out of the qubits. Today, programming in higher-level languages like Python entails constructing these circuits declaratively.

- These circuits can then be executed on real quantum computers in the cloud! Example providers include [Amazon Braket](https://aws.amazon.com/braket/), [IBM Quantum Experience](https://www.ibm.com/quantum-computing/technology/experience/), [Rigetti Quantum Cloud](https://www.rigetti.com/systems) and [Azure Quantum](https://azure.microsoft.com/en-us/services/quantum/) to name a few.

- Currently, real quantum computers have some accuracy errors, where sometimes the measurements show incorrect results. The current solution is to run the program multiple times to reduce the error rate. In the future, quantum computers will have less noise.

## Q&A session with Milana Lewis, co-founder and CEO of Stem

The first keynote session was a Q&A session with Milana (Rabkin) Lewis the co-founder and CEO of Stem, a financial platform that simplifies payments for musicians and content creators. These are the insights that stuck out to me:

- **Measuring churn is hard.** _Hard churn_ is easy, when an artist removes their content from Stem. _Soft churn_ is hard to measure, when an artist may even grow within the platform despite having moved to another platform. This makes it hard to measure Lifetime Value (LTV) of a user.

- **The industry is oscillating between human and algorithmic curation of content.** An artist thinks: how can I get my content in front of listeners? When analyzing the data, it's important to think about what the artist wants. If a song is added to a popular playlist, what insights can we surface to the artist so they can maximize this opportunity?

- There is a significant delay between when user interaction data is collected and when financial data is available. This makes it **hard to understand revenue impact of user interactions**.

- A hands-on approach, i.e. talking to individual users, is still necessary. Who to talk to can be driven by data science, but **human conversations provide important insights**.

## And all the rest

I learned tons from all the talks, so here are some interesting tidbits that don't really fit under any other category:

- **There's a gap between business reports and model assessment reports.** The former doesn't incorporate the models used to power the business, and the latter doesn't demonstrate the business impact of the model. Data science reporting bridges the two. In order to communicate the impact of the model, it's important to have a continuously monitored baseline: how does the key metric behave when there is no model? **Even if the model performs well, a baseline must be run indefinitely to catch regressions.**

- There are many ways to evaluate the performance of a model. To name a few: precision, recall, F1 score, Matthews Correlation Coefficient, R-Squared, Root Mean Squared, etc. Each score applies to different types of models (binary classification vs. multi-class vs. regression) and incorporates different information. As a result, **it's important to understand what the metric is measuring, as any single metric will only be a proxy to the true performance of the model.**

- [Carpentries](https://carpentries.org/) teaches programming and data science to researchers, making these skills more accessible.

---

PyData LA 2019 was a fantastically informative three days. I'm grateful for the opportunity to learn as much as a I did, to meet all the wonderful people I did, and to share my knowledge with others both on and off the stage.
