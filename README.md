# knowledge-ark-diagnostic-center
Provide a set of intelligent diagnostic and optimization tools for deep knowledge workers, helping them transform their Obsidian knowledge base from a static "information graveyard" into a structured, computable "living system" that can seamlessly collaborate with future AI.

## Features

- Local knowledge base health diagnosis based on deterministic rules
- Export "healthy" knowledge as high-quality JSONL training datasets
- Provide multiple diagnostic rules, including:
  - Metadata integrity check
  - Note atomicity check
  - Naked links check
  - Knowledge graph connectivity check
  - Predicate consistency check
- Customizable diagnostic parameters and export templates

## Installation

1. In Obsidian, go to Settings > Third-party plugins
2. Turn off "Safe mode"
3. Click "Browse community plugins", search for "Knowledge Ark Diagnostic Center"
4. Click "Install"
5. Enable the plugin after installation

Alternatively, you can install the plugin manually:

1. Download the latest version of the plugin files
2. Extract the files to your Vault's `.obsidian/plugins/` directory
3. In Obsidian, go to Settings > Third-party plugins
4. Enable the "Knowledge Ark Diagnostic Center" plugin

## Usage

1. Click the "Knowledge Ark" icon in the left Ribbon area of Obsidian
2. Open the "Knowledge Ark Diagnostic Center" view in the right sidebar
3. Click the "Start Comprehensive Diagnosis" button
4. View the diagnosis results and optimize according to the suggestions
5. Use the "Export Healthy Notes" button to export healthy notes in JSONL format

## Configuration

You can customize the following parameters in the plugin settings:

- Required metadata field list
- Maximum note length
- Naked link context check length
- Folders or tags to exclude from diagnosis
- JSONL export format template

## API Documentation

See https://github.com/obsidianmd/obsidian-api
