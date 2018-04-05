package com.indooratlas.tracker.agent;

import android.net.wifi.ScanResult;

import java.util.List;

/**
 *
 */
public interface ObservationHandler {

    void onWifiScan(List<ScanResult> results);

}
