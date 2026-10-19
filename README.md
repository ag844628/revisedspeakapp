# Companion (newspeakapp)

Android application built with Kotlin and Jetpack Compose for managing companion voice assistant profiles with Marathi Text-to-Speech (TTS), custom voice playback, and background listening service.

## Features
- **व्हॉईस असिस्टंट डॅशबोर्ड**: Dashboard built with Jetpack Compose Material 3.
- **बॅकग्राउंड लिसनिंग सर्व्हिस**: Foreground service (`ListeningService`) for microphone listening with persistent status indicator and notifications.
- **प्रोफाइल तयार करणे**: Manage companion profiles with name, gender, age, profession, and relationship.
- **ऑडिओ आणि आवाज**:
  - TTS greeting in Marathi with gender-specific pitch control (`Locale("mr", "IN")`).
  - Custom audio file selection and playback support.
