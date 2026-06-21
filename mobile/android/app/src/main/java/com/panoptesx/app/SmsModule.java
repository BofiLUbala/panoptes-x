package com.panoptesx.app;

import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.ArrayList;
import java.util.List;

public class SmsModule extends ReactContextBaseJavaModule {
    private static final String TAG = "SmsModule";
    private static final String MODULE_NAME = "SmsModule";
    private static SmsModule instance;
    private final ReactApplicationContext reactContext;
    private final List<WritableMap> pendingSms = new ArrayList<>();

    public SmsModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
        instance = this;
    }

    public static SmsModule getInstance() {
        return instance;
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    public void emitSmsReceived(String sender, String message, long timestamp) {
        WritableMap params = Arguments.createMap();
        params.putString("sender", sender);
        params.putString("message", message);
        params.putDouble("timestamp", timestamp);

        synchronized (pendingSms) {
            pendingSms.add(params);
        }

        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("SmsReceived", params);
        }
    }

    @ReactMethod
    public void getPendingSms(Promise promise) {
        WritableArray arr = Arguments.createArray();
        synchronized (pendingSms) {
            for (WritableMap sms : pendingSms) {
                arr.pushMap(sms);
            }
            pendingSms.clear();
        }
        promise.resolve(arr);
    }
}
