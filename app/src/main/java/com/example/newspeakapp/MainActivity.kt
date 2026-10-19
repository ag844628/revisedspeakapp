package com.example.newspeakapp

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import java.util.*

class MainActivity : ComponentActivity(), TextToSpeech.OnInitListener {

    private lateinit var tts: TextToSpeech
    private var mediaPlayer: MediaPlayer? = null
    var selectedProfileForAudio by mutableStateOf<((Uri) -> Unit)?>(null)
    private var serviceRunning by mutableStateOf(false)

    // गॅलरी किंवा फाईल मॅनेजरमधून ऑडिओ निवडण्यासाठी लॉंचर
    private val audioPickerLauncher = registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let {
            selectedProfileForAudio?.invoke(it)
        }
    }

    // मायक्रोफोन आणि नोटिफिकेशन परवानगी मागण्यासाठी लॉंचर
    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) {
        if (hasMicPermission()) {
            startListeningService()
        } else {
            Toast.makeText(
                this,
                "मायक्रोफोन परवानगी आवश्यक आहे. कृपया सेटिंग्जमधून परवानगी द्या.",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        tts = TextToSpeech(this, this)

        setContent {
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = MaterialTheme.colorScheme.background
            ) {
                ProfileDashboard(
                    serviceRunning = serviceRunning,
                    onToggleService = { toggleListeningService() },
                    onSpeak = { text, gender, audioUri -> 
                        playResponse(text, gender, audioUri) 
                    },
                    onSelectAudio = { callback ->
                        selectedProfileForAudio = callback
                        audioPickerLauncher.launch("audio/*")
                    }
                )
            }
        }
    }

    override fun onResume() {
        super.onResume()
        serviceRunning = ListeningService.isRunning
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            tts.language = Locale("mr", "IN")
        }
    }

    private fun hasMicPermission(): Boolean =
        ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) ==
                PackageManager.PERMISSION_GRANTED

    private fun toggleListeningService() {
        if (serviceRunning) {
            stopListeningService()
            return
        }

        val needed = mutableListOf<String>()
        if (!hasMicPermission()) {
            needed.add(Manifest.permission.RECORD_AUDIO)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            needed.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        if (needed.isEmpty()) {
            startListeningService()
        } else {
            permissionLauncher.launch(needed.toTypedArray())
        }
    }

    private fun startListeningService() {
        ContextCompat.startForegroundService(this, Intent(this, ListeningService::class.java))
        serviceRunning = true
    }

    private fun stopListeningService() {
        stopService(Intent(this, ListeningService::class.java))
        serviceRunning = false
    }

    private fun playResponse(text: String, gender: String, audioUri: String?) {
        // जर युजरने स्वतःचा ऑडिओ अपलोड केला असेल, तर तो ऑडिओ प्ले होईल
        if (!audioUri.isNullOrEmpty()) {
            try {
                mediaPlayer?.release()
                mediaPlayer = MediaPlayer().apply {
                    setDataSource(applicationContext, Uri.parse(audioUri))
                    prepare()
                    start()
                }
                return
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        // ऑडिओ नसेल तर डिफॉल्ट Text-to-Speech बोलेल
        if (gender.equals("Female", ignoreCase = true)) {
            tts.setPitch(1.3f)
            tts.setSpeechRate(1.0f)
        } else {
            tts.setPitch(0.8f)
            tts.setSpeechRate(1.0f)
        }
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, null)
    }

    override fun onDestroy() {
        if (::tts.isInitialized) {
            tts.stop()
            tts.shutdown()
        }
        mediaPlayer?.release()
        super.onDestroy()
    }
}

@Composable
fun ProfileDashboard(
    serviceRunning: Boolean,
    onToggleService: () -> Unit,
    onSpeak: (String, String, String?) -> Unit,
    onSelectAudio: ((Uri) -> Unit) -> Unit
) {
    val context = LocalContext.current
    var profiles by remember { mutableStateOf(listOf<Profile>()) }

    var name by remember { mutableStateOf("") }
    var gender by remember { mutableStateOf("Male") }
    var age by remember { mutableStateOf("") }
    var profession by remember { mutableStateOf("") }
    var relationship by remember { mutableStateOf("") }
    var currentEditingProfileId by remember { mutableStateOf<Int?>(null) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        item {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(text = "व्हॉईस असिस्टंट डॅशबोर्ड", style = MaterialTheme.typography.headlineMedium)
                Spacer(modifier = Modifier.height(8.dp))

                // बॅकग्राउंड लिसनिंग सर्व्हिस चालू/बंद
                Card(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = "बॅकग्राउंड लिसनिंग सर्व्हिस", style = MaterialTheme.typography.titleSmall)
                            Text(
                                text = if (serviceRunning) "🟢 चालू आहे" else "⚪ बंद आहे",
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                        Button(onClick = onToggleService) {
                            Text(if (serviceRunning) "थांबवा" else "सुरू करा")
                        }
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("प्रोफाइलचे नाव") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Button(onClick = { gender = "Male" }) { Text(if (gender == "Male") "✔ Male" else "Male") }
                    Button(onClick = { gender = "Female" }) { Text(if (gender == "Female") "✔ Female" else "Female") }
                }

                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(value = age, onValueChange = { age = it }, label = { Text("वय (Age)") }, modifier = Modifier.fillMaxWidth())
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(value = profession, onValueChange = { profession = it }, label = { Text("प्रोफेशन (Profession)") }, modifier = Modifier.fillMaxWidth())
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(value = relationship, onValueChange = { relationship = it }, label = { Text("नातेसंबंध (Relationship)") }, modifier = Modifier.fillMaxWidth())

                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = {
                        if (name.isNotBlank()) {
                            val newProfile = Profile(
                                id = profiles.size + 1,
                                name = name,
                                gender = gender,
                                age = age,
                                profession = profession,
                                relationship = relationship,
                                audioUri = null
                            )
                            profiles = profiles + newProfile
                            name = ""; age = ""; profession = ""; relationship = ""
                            Toast.makeText(context, "प्रोफाइल तयार झाली!", Toast.LENGTH_SHORT).show()
                        } else {
                            Toast.makeText(context, "कृपया नाव प्रविष्ट करा", Toast.LENGTH_SHORT).show()
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("नवीन प्रोफाइल जोडा")
                }

                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider()
                Spacer(modifier = Modifier.height(8.dp))

                Text(text = "तयार केलेल्या प्रोफाइल्स:", style = MaterialTheme.typography.titleMedium)
            }
        }

        items(profiles) { profile ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(text = "नाव: ${profile.name} (${profile.gender})", style = MaterialTheme.typography.titleSmall)
                    Text(text = "वय: ${profile.age} | प्रोफेशन: ${profile.profession}")
                    Text(text = "नातेसंबंध: ${profile.relationship}")
                    Text(text = if (profile.audioUri != null) "🎙️ कस्टम ऑडिओ जोडलेला आहे" else "🔊 डीफॉल्ट व्हॉईस वापरत आहे")

                    Spacer(modifier = Modifier.height(8.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Button(onClick = {
                            val greeting = "नमस्कार, मी ${profile.name} बोलत आहे."
                            onSpeak(greeting, profile.gender, profile.audioUri)
                        }) {
                            Text("ऐका (Speak)")
                        }

                        Button(onClick = {
                            currentEditingProfileId = profile.id
                            onSelectAudio { uri ->
                                profiles = profiles.map { p ->
                                    if (p.id == currentEditingProfileId) p.copy(audioUri = uri.toString()) else p
                                }
                                Toast.makeText(context, "आवाज यशस्वीरीत्या अपलोड झाला!", Toast.LENGTH_SHORT).show()
                            }
                        }) {
                            Text("आवाज अपलोड करा")
                        }
                    }
                }
            }
        }
    }
}
