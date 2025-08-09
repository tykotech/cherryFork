# Storage

## File Persistence

```mermaid
graph TD
    A[Upload] -->|writes| B[Uploads Directory]
    C[List] -->|reads| B
    D[Delete] -->|removes| B
```

Files are stored under `packages/database/data/uploads` and can be uploaded, listed, or deleted through the storage APIs.

## Vector Index

```mermaid
erDiagram
    VECTORS {
        int id PK
        text content
        vector embedding
        json metadata
    }
```

Embeddings are generated via OpenAI's `text-embedding-3-small` model and persisted in a Postgres table using the `pgvector` extension. Queries compute similarity with `<=>` distance.
