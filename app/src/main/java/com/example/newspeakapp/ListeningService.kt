package com.example.newspeakapp

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

class ListeningService : Service() {

    companion object {
        const val CHANNEL_ID = "ListeningServiceChannel"
        const val NOTIFICATION_ID = 1

        // MainActivity ला सर्व्हिस चालू आहे का ते कळण्यासाठी
        @Volatile
        var isRunning = false
    }

    override fun onCreate() {
        super.onCreate()
        isRunning = true
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = createNotification("Service is running in background...")

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                ServiceCompat.startForeground(
                    this,
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
                )
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (e: Exception) {
            // परवानगी नसेल तर app crash होऊ नये म्हणून सर्व्हिस थांबवतो
            e.printStackTrace()
            stopSelf()
            return START_NOT_STICKY
        }

        return START_STICKY
    }

    private fun createNotification(text: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Companion App Active")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Listening Service Channel",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(serviceChannel)
        }
    }

    override fun onDestroy() {
        isRunning = false
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}
