package com.panoptesx.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "SmsReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction() != null
                && intent.getAction().equals("android.provider.Telephony.SMS_RECEIVED")) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                if (pdus != null) {
                    for (Object pdu : pdus) {
                        try {
                            SmsMessage sms;
                            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                                String format = bundle.getString("format");
                                sms = SmsMessage.createFromPdu((byte[]) pdu, format);
                            } else {
                                sms = SmsMessage.createFromPdu((byte[]) pdu);
                            }
                            String sender = sms.getDisplayOriginatingAddress();
                            String message = sms.getMessageBody();
                            long timestamp = System.currentTimeMillis();

                            Log.d(TAG, "SMS capté de " + sender);

                            SmsModule module = SmsModule.getInstance();
                            if (module != null) {
                                module.emitSmsReceived(sender, message, timestamp);
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "Erreur parsing SMS", e);
                        }
                    }
                }
            }
        }
    }
}
