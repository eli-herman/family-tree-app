# RAG Documentation Sources

This folder contains documentation that gets indexed into ChromaDB for semantic search.

## Structure

```
rag-docs/
├── react-native/    # React Native core docs
├── expo/            # Expo SDK docs
└── firebase/        # Firebase JS SDK docs
```

## Downloading Documentation

### Option 1: Clone Official Doc Repos (Recommended)

```bash
# React Native docs (markdown files)
cd .claude/rag-docs/react-native
git clone --depth 1 https://github.com/facebook/react-native-website.git temp
mv temp/docs/* .
rm -rf temp

# Expo docs
cd .claude/rag-docs/expo
git clone --depth 1 https://github.com/expo/expo.git temp
mv temp/docs/pages/* .
rm -rf temp

# Firebase docs (web SDK)
cd .claude/rag-docs/firebase
# Firebase docs aren't in a clean markdown repo
# Use the script below to fetch key pages
```

### Option 2: Use Download Script

Run the indexing script (after Windows PC is set up):
```bash
node .claude/scripts/download-docs.js
```

### Option 3: Manual Selection

For a lighter setup, manually save key documentation pages:

**React Native (most useful):**
- Components: View, Text, Image, ScrollView, FlatList
- APIs: StyleSheet, Animated, Dimensions
- Guides: Navigation, Networking, Security

**Expo (most useful):**
- expo-router
- expo-camera
- expo-notifications
- expo-secure-store
- expo-image-picker

**Firebase (most useful):**
- Authentication (email, Google, Apple)
- Firestore (queries, real-time)
- Storage (upload, download)
- Security Rules

## File Format

Each doc file should be markdown with clear sections:

```markdown
# Component Name

## Overview
Brief description...

## Usage
\`\`\`jsx
import { Component } from 'react-native';
\`\`\`

## Props
| Prop | Type | Description |
|------|------|-------------|
| ... | ... | ... |

## Examples
...
```

## Indexing

Once docs are downloaded and Windows PC is set up:

```bash
# From Windows PC
node index-docs.js --source=react-native --collection=docs
node index-docs.js --source=expo --collection=docs
node index-docs.js --source=firebase --collection=docs
```

## Updating Docs

Re-download periodically (monthly?) to stay current:
```bash
# Delete old and re-download
rm -rf react-native/*
# ... repeat download steps
# Re-index on Windows PC
```
