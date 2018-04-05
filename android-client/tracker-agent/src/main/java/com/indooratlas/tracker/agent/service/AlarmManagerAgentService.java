package com.indooratlas.tracker.agent.service;

import android.app.AlarmManager;
import android.app.IntentService;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.wifi.ScanResult;
import android.net.wifi.WifiManager;
import android.support.annotation.Nullable;
import android.util.Log;

import com.indooratlas.tracker.agent.AgentConstants;
import com.indooratlas.tracker.agent.ConfigHelper;
import com.indooratlas.tracker.agent.ObservationHandler;
import com.indooratlas.tracker.agent.SimpleObservationHandler;

import java.util.List;

/**
 * Tracker agent based on AlarmManager scheduling. Don't use for production.
 */
public class AlarmManagerAgentService extends IntentService {

    private static final String TAG = AgentConstants.TAG;

    private static final String ACTION_UPDATE_LOCATION = AlarmManager.class.getPackage().getName()
            + ".intent.action.UPDATE_LOCATION";

    private static BroadcastReceiver sWifiScanReceiver = new WifiScanReceiver();

    private ObservationHandler mObservationHandler;

    public AlarmManagerAgentService() {
        super(TAG);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        ConfigHelper config = new ConfigHelper(this);
        mObservationHandler = new SimpleObservationHandler(
                config.getApiKey(),
                config.getAgentId(),
                config.getEndpoint());
    }

    @Override
    protected void onHandleIntent(@Nullable Intent intent) {

        Log.d(TAG, "agent service processing intent: " + intent);

        if (ACTION_UPDATE_LOCATION.equals(intent.getAction())) {
            startWifiScan();
        } else if (WifiManager.SCAN_RESULTS_AVAILABLE_ACTION.equals(intent.getAction())) {
            handleWifiResult();
        }

    }

    public static void startAgent(Context context) {

        ConfigHelper config = new ConfigHelper(context);
        if (!config.isConfigValid()) {
            Log.e(TAG, "invalid config, cannot start service");
            return;
        }

        context.registerReceiver(sWifiScanReceiver,
                new IntentFilter(WifiManager.SCAN_RESULTS_AVAILABLE_ACTION));

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        alarmManager.setInexactRepeating(AlarmManager.ELAPSED_REALTIME_WAKEUP,
                config.getUpdateIntervalMillis(),
                config.getUpdateIntervalMillis(),
                createScanRequestIntent(context));

        Log.d(TAG, "agent started");
    }

    public static void stopAgent(Context context) {

        try {
            context.unregisterReceiver(sWifiScanReceiver);
        } catch (IllegalArgumentException notRegistered) {
            // N/A
        }

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        alarmManager.cancel(createScanRequestIntent(context));

        Log.d(TAG, "agent stopped");
    }

    private static PendingIntent createScanRequestIntent(Context context) {
        Intent intent = new Intent(context, AlarmManagerAgentService.class);
        intent.setAction(ACTION_UPDATE_LOCATION);
        return PendingIntent.getService(context, 1, intent, 0);
    }

    private void startWifiScan() {

        WifiManager wifiManager = (WifiManager) getApplicationContext()
                .getSystemService(Context.WIFI_SERVICE);
        wifiManager.startScan();

    }

    private void handleWifiResult() {

        WifiManager wifiManager = (WifiManager) getApplicationContext()
                .getSystemService(Context.WIFI_SERVICE);
        List<ScanResult> results = wifiManager.getScanResults();
        Log.d(TAG, "agent service processing wifi results");
        mObservationHandler.onWifiScan(results);

    }

    private static class WifiScanReceiver extends BroadcastReceiver {

        @Override
        public void onReceive(Context context, Intent intent) {
            Intent copyIntent = new Intent(intent);
            copyIntent.setClass(context, AlarmManagerAgentService.class);
            context.startService(copyIntent);
        }
    }
}
