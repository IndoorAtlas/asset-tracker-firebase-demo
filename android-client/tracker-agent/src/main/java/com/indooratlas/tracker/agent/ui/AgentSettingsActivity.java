package com.indooratlas.tracker.agent.ui;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.preference.Preference;
import android.preference.PreferenceActivity;
import android.preference.PreferenceFragment;
import android.preference.PreferenceManager;
import android.support.annotation.Nullable;
import android.util.Log;
import android.widget.Toast;

import com.indooratlas.tracker.R;
import com.indooratlas.tracker.agent.AgentConstants;
import com.indooratlas.tracker.agent.ConfigHelper;
import com.indooratlas.tracker.agent.service.AlarmManagerAgentService;

public class AgentSettingsActivity extends PreferenceActivity {


    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        PreferenceManager.setDefaultValues(this, R.xml.preferences, false);
        getFragmentManager()
                .beginTransaction()
                .replace(android.R.id.content, new AgentPreferenceFragment())
                .commit();
    }


    public static class AgentPreferenceFragment extends PreferenceFragment implements SharedPreferences.OnSharedPreferenceChangeListener {

        private ConfigHelper mConfigHelper;

        @Override
        public void onResume() {
            super.onResume();
            getPreferenceManager().getSharedPreferences()
                    .registerOnSharedPreferenceChangeListener(this);
        }

        @Override
        public void onPause() {
            super.onPause();
            getPreferenceManager().getSharedPreferences()
                    .unregisterOnSharedPreferenceChangeListener(this);
        }

        @Override
        public void onCreate(@Nullable Bundle savedInstanceState) {
            super.onCreate(savedInstanceState);
            mConfigHelper = new ConfigHelper(getActivity());
            addPreferencesFromResource(R.xml.preferences);
            PreferenceManager.setDefaultValues(getActivity(), R.xml.preferences, false);
            updateDisplayValues();

            final PreferenceManager manager = getPreferenceManager();
            manager.findPreference("startAgent")
                    .setOnPreferenceClickListener(new Preference.OnPreferenceClickListener() {
                        @Override
                        public boolean onPreferenceClick(Preference preference) {
                            Context context = getActivity();
                            if (!mConfigHelper.isConfigValid()) {
                                Toast.makeText(context, R.string.msg_cannot_start_agent_bad_config,
                                        Toast.LENGTH_LONG).show();
                                return true;
                            }
                            AlarmManagerAgentService.startAgent(context);
                            return true;
                        }
                    });
            manager.findPreference("stopAgent")
                    .setOnPreferenceClickListener(new Preference.OnPreferenceClickListener() {
                        @Override
                        public boolean onPreferenceClick(Preference preference) {
                            Context context = getActivity();
                            AlarmManagerAgentService.stopAgent(context);
                            return true;
                        }
                    });

            manager.findPreference("myLocation")
                    .setOnPreferenceClickListener(new Preference.OnPreferenceClickListener() {
                        @Override
                        public boolean onPreferenceClick(Preference preference) {
                            if (mConfigHelper.isConfigValid()) {
                                Uri uri = Uri.parse("https://ia-asset-tracker-demo.firebaseapp.com/#"
                                        + mConfigHelper.getApiKey());
                                startActivity(new Intent(Intent.ACTION_VIEW)
                                        .setData(uri));
                            }
                            return true;
                        }
                    });
        }


        private void updateDisplayValues() {
            final PreferenceManager manager = getPreferenceManager();
            manager.findPreference("agentId").setSummary(mConfigHelper.getAgentId());
            manager.findPreference("endpoint").setSummary(mConfigHelper.getEndpoint());
            manager.findPreference("apiKey").setSummary(mConfigHelper.getApiKey());
            manager.findPreference("updateInterval")
                    .setSummary(String.valueOf(mConfigHelper.getUpdateInterval()));
        }


        @Override
        public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
            Log.d(AgentConstants.TAG, "preference changed: " + key);
            updateDisplayValues();
        }
    }
}
