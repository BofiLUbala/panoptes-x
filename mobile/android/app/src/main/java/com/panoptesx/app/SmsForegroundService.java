package com.panoptesx.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

public class SmsForegroundService extends Service {
    private static final String CHANNEL_ID = "panoptesx_sms_monitor";
    private static final int NOTIFICATION_ID = 4821;

    public static final String ACTION_START = "com.panoptesx.app.action.START_SMS_MONITOR";
    public static final String ACTION_STOP = "com.panoptesx.app.action.STOP_SMS_MONITOR";

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        createNotificationChannel();
        Notification notification = buildNotification();
        startForeground(NOTIFICATION_ID, notification);

        // START_STICKY: ask the OS to recreate this service if it gets killed under memory pressure.
        return START_STICKY;
    }

    private Notification buildNotification() {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent contentIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_IMMUTABLE
        );

        return new Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("Panoptes-X")
            .setContentText("Surveillance SMS active")
            .setSmallIcon(getApplicationInfo().icon)
            .setContentIntent(contentIntent)
            .setOngoing(true)
            .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Surveillance SMS",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Maintient la surveillance des SMS Mobile Money active en arriere-plan");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
