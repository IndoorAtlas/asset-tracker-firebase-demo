package com.indooratlas.tracker.agent;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;

/**
 *
 */
public class ConfigHelper {

    private SharedPreferences mPrefs;

    public ConfigHelper(Context context) {
        mPrefs = PreferenceManager.getDefaultSharedPreferences(context);
    }

    public String getAgentId() {
        return mPrefs.getString("agentId", null);
    }

    public long getUpdateInterval() {
        return Long.parseLong(mPrefs.getString("updateInterval",
                String.valueOf(AgentConstants.DEFAULT_UPDATE_INTERVAL)));
    }

    public long getUpdateIntervalMillis() {
        return getUpdateInterval() * 1000;
    }


    public boolean isConfigValid() {
        String agentId = getAgentId();
        if (agentId == null || agentId.trim().equals("")) {
            return false;
        }
        String endpoint = getEndpoint();
        if (endpoint == null || endpoint.trim().equals("")) {
            return false;
        }
        String apiKey = getApiKey();
        if (apiKey == null || apiKey.trim().equals("")) {
            return false;
        }
        return true;
    }


    public String getEndpoint() {
        return mPrefs.getString("endpoint", null);
    }

    public String getApiKey() {
        return mPrefs.getString("apiKey", null);
    }
}
