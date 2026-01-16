# Visual Design Gallery API Endpoints

This document outlines the API endpoints used by the Visual Design Gallery across various tools.

All endpoints require **Authentication**. Include the `Authorization: Bearer <token>` header in requests.

## Neuroaesthetic Tool

### Get History

- **URL**: `GET /api/neuroaesthetic/history`
- **Description**: Returns a list of past analyses.
- **Response**:
  ```json
  {
    "history": [
      {
        "id": 1,
        "originalImage": "url...",
        "generatedImage": "url...",
        "analysis": { ... },
        "timestamp": "2023-10-27T..."
      }
    ]
  }
  ```

### Delete History Item

- **URL**: `DELETE /api/neuroaesthetic/history/:id`
- **Description**: Permanently deletes a specific history item.
- **Response**: `{ "message": "History item deleted" }`

---

## Pin Pals

### Get Gallery

- **URL**: `GET /api/pin-pals/gallery`
- **Description**: Returns all generated pins for the user.
- **Response**:
  ```json
  {
    "pins": [
      {
        "id": 1,
        "imageUrl": "url...",
        "petType": "dog",
        "petCount": 1,
        "createdAt": "..."
      }
    ]
  }
  ```

### Delete Pin

- **URL**: `DELETE /api/pin-pals/gallery/:id`
- **Description**: Permanently deletes a pin from the gallery.
- **Response**: `{ "message": "Gallery item deleted" }`

---

## Mediscribe AI

### Get Examples

- **URL**: `GET /api/mediscribe/examples`
- **Description**: Returns saved clinical note examples/history.
- **Response**:
  ```json
  {
    "examples": [
      {
        "id": 1,
        "original": "shorthand text...",
        "rewritten": "full note...",
        "tags": ["cardiology"]
      }
    ]
  }
  ```

### Delete Example

- **URL**: `DELETE /api/mediscribe/examples/:id`
- **Description**: Deletes a saved note.
- **Response**: `{ "message": "Example deleted" }`

---

## Public Health Organizer

### Get Saved Documents

- **URL**: `GET /api/public-health/docs`
- **Description**: Returns saved document analysis sessions.
- **Response**:
  ```json
  {
    "docs": [
      {
        "id": "1",
        "filename": "protocol.pdf",
        "rag_store_name": "...",
        "analysis": { ... },
        "tags": ["v1", "urgent"],
        "category": "protocol",
        "uploaded_at": "..."
      }
    ]
  }
  ```

### Delete Document

- **URL**: `DELETE /api/public-health/docs/:id`
- **Description**: Deletes a saved document and its metadata.
- **Response**: `{ "message": "Document deleted" }`
