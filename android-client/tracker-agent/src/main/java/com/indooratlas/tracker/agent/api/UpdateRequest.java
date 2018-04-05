package com.indooratlas.tracker.agent.api;

import java.util.ArrayList;
import java.util.List;

/**
 *
 */
public class UpdateRequest {

    public List<WifiObservation> wifis = new ArrayList<>();

    public static class WifiObservation {

        public String macAddress;

        public int signalStrength;

        public WifiObservation() {
        }
        
        public WifiObservation(String macAddress, int signalStrength) {
            this.macAddress = macAddress;
            this.signalStrength = signalStrength;
        }

    }

}
