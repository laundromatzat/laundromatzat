# Personal Website/Portfolio

This repository contains the source code for my personal website/portfolio, built using the [Hugo](https://gohugo.io/) static site generator.

## Overview

The website showcases a collection of images, videos, and cinemagraphs. The content is organized and managed using Hugo's content management features.

## Structure

- `content/`: Contains the markdown files for images, videos, cinemagraphs, and other pages like 'About'.
- `data/`: Holds YAML files likely used for populating content sections.
- `layouts/`: Defines the HTML structure and templates for different content types.
- `static/`: Stores static assets like images, CSS, and JavaScript.
- `public/`: This directory contains the generated static website, ready for deployment. It's usually not tracked in Git if the site is built and deployed via a CI/CD pipeline.
- `hugo.toml`: The main configuration file for the Hugo site.

## Running Locally (Typical Hugo Setup)

To run this website locally, you would typically need to:

1.  **Install Hugo:** Follow the [official Hugo installation guide](https://gohugo.io/installation/).
2.  **Clone the repository:** `git clone <repository-url>`
3.  **Navigate to the directory:** `cd <repository-name>`
4.  **Run the Hugo server:** `hugo server -D` (The `-D` flag includes draft content)

This will start a local server (usually at `http://localhost:1313/`) where you can view the site.

## Deployment

The site is likely deployed by building the static files (using the `hugo` command) and then hosting the contents of the `public/` directory on a web server or a static site hosting service. Check the `.github/workflows/deploy.yml` for specifics on the deployment process for this repository.
