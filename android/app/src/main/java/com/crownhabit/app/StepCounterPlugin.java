package com.crownhabit.app;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@CapacitorPlugin(
    name = "StepCounter",
    permissions = {
        @Permission(
            strings = { Manifest.permission.ACTIVITY_RECOGNITION },
            alias = "activityRecognition"
        )
    }
)
public class StepCounterPlugin extends Plugin implements SensorEventListener {
    private static final String PREFS_NAME = "crown_habit_step_sensor";
    private SensorManager sensorManager;
    private Sensor stepCounterSensor;
    private Sensor stepDetectorSensor;
    private boolean isListening = false;
    private int fallbackDetectorSteps = 0;

    @Override
    public void load() {
        Context context = getContext();
        if (context != null) {
            sensorManager = (SensorManager) context.getSystemService(Context.SENSOR_SERVICE);
            if (sensorManager != null) {
                stepCounterSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
                stepDetectorSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR);
            }
        }
    }

    private String getTodayKey() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
    }

    @PluginMethod
    public void startTracking(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            if (getPermissionState("activityRecognition") != PermissionState.GRANTED) {
                requestPermissionForAlias("activityRecognition", call, "activityPermissionCallback");
                return;
            }
        }
        registerSensors(call);
    }

    @PermissionCallback
    private void activityPermissionCallback(PluginCall call) {
        if (getPermissionState("activityRecognition") == PermissionState.GRANTED) {
            registerSensors(call);
        } else {
            call.reject("Activity recognition permission denied");
        }
    }

    private void registerSensors(PluginCall call) {
        if (sensorManager == null) {
            call.reject("SensorManager unavailable");
            return;
        }
        if (!isListening) {
            boolean registered = false;
            if (stepCounterSensor != null) {
                registered = sensorManager.registerListener(this, stepCounterSensor, SensorManager.SENSOR_DELAY_NORMAL);
            }
            if (stepDetectorSensor != null) {
                boolean det = sensorManager.registerListener(this, stepDetectorSensor, SensorManager.SENSOR_DELAY_NORMAL);
                registered = registered || det;
            }
            isListening = registered;
        }
        JSObject ret = new JSObject();
        ret.put("started", isListening);
        ret.put("hasHardwareStepCounter", stepCounterSensor != null || stepDetectorSensor != null);
        call.resolve(ret);
    }

    @PluginMethod
    public void stopTracking(PluginCall call) {
        if (sensorManager != null && isListening) {
            sensorManager.unregisterListener(this);
            isListening = false;
        }
        JSObject ret = new JSObject();
        ret.put("stopped", true);
        call.resolve(ret);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        Context context = getContext();
        if (context == null) return;

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String todayKey = getTodayKey();
        String savedDate = prefs.getString("step_date", "");

        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            int totalSinceReboot = (int) event.values[0];
            int baseline = prefs.getInt("baseline_steps", -1);

            if (!todayKey.equals(savedDate) || baseline < 0 || totalSinceReboot < baseline) {
                baseline = totalSinceReboot;
                prefs.edit()
                    .putString("step_date", todayKey)
                    .putInt("baseline_steps", baseline)
                    .apply();
            }

            int todaySteps = Math.max(0, totalSinceReboot - baseline);
            JSObject data = new JSObject();
            data.put("todaySteps", todaySteps);
            data.put("sensorType", "hardware_counter");
            notifyListeners("stepEvent", data);
        } else if (event.sensor.getType() == Sensor.TYPE_STEP_DETECTOR && stepCounterSensor == null) {
            if (!todayKey.equals(savedDate)) {
                fallbackDetectorSteps = 0;
                prefs.edit().putString("step_date", todayKey).apply();
            }
            fallbackDetectorSteps += 1;
            JSObject data = new JSObject();
            data.put("stepIncrement", 1);
            data.put("sensorType", "hardware_detector");
            notifyListeners("stepDetectorEvent", data);
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
    }
}
