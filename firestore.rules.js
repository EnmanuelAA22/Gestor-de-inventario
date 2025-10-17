rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura total durante desarrollo
    match /{document=**} {
      allow read, write: if true;
    }
  }
}