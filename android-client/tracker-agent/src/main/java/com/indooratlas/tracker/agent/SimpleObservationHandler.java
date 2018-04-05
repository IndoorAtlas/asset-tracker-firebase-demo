package com.indooratlas.tracker.agent;

import android.net.wifi.ScanResult;
import android.util.Log;

import com.indooratlas.tracker.BuildConfig;
import com.indooratlas.tracker.agent.api.AgentLocatorApi;
import com.indooratlas.tracker.agent.api.UpdateRequest;

import java.io.IOException;
import java.util.List;

import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

import static com.indooratlas.tracker.agent.AgentConstants.TAG;

/**
 * Handle observations by sending them to cloud as soon as observations arrive.
 */
public class SimpleObservationHandler implements ObservationHandler {

    private String mAgentId;
    private String mApiKey;
    private String mEndpoint;

    public SimpleObservationHandler(String apiKey, String agentId, String endpoint) {
        mAgentId = agentId;
        mEndpoint = endpoint;
        mApiKey = apiKey;
    }

    @Override
    public void onWifiScan(List<ScanResult> results) {

        AgentLocatorApi api = createApi();
        try {
            Response<Void> response = api.updateObservations(mApiKey, mAgentId, convert(results))
                    .execute();
            if (!response.isSuccessful()) {
                Log.w(TAG, "server error while sending observations, code: " + response.code()
                        + ", message: " + response.message());
            } else {
                Log.d(TAG, "observations sent to server");
            }
        } catch (IOException e) {
            Log.w(TAG, "i/o error while sending observations", e);
        }

    }

    private static UpdateRequest convert(List<ScanResult> results) {
        UpdateRequest request = new UpdateRequest();
        if (results == null || results.isEmpty()) {
            return request;
        }
        for (ScanResult result : results) {
            request.wifis.add(new UpdateRequest.WifiObservation(result.BSSID, result.level));
        }
        return request;
    }

    private AgentLocatorApi createApi() {

        OkHttpClient.Builder httpClient = new OkHttpClient.Builder();

        if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
            logging.setLevel(HttpLoggingInterceptor.Level.BODY);
            httpClient.addInterceptor(logging);
        }

        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(mEndpoint)
                .addConverterFactory(GsonConverterFactory.create())
                .client(httpClient.build())
                .build();
        return retrofit.create(AgentLocatorApi.class);
    }
}
