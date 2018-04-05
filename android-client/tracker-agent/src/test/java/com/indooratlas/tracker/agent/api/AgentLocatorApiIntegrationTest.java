package com.indooratlas.tracker.agent.api;

import org.junit.Test;

import java.io.IOException;

import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

/**
 *
 */
public class AgentLocatorApiIntegrationTest {

    private static final String API_KEY_OK = "650cb46a-3b37-4615-a2f0-0fcdbeee5e61";

    private static final String AGENT_ID_OK = AgentLocatorApiIntegrationTest.class.getSimpleName();


    @Test
    public void updateWithBadEmptyBodyReturnsError() throws IOException {

        Response<Void> response = api().updateObservations(API_KEY_OK, AGENT_ID_OK,
                new UpdateRequest())
                .execute();
        assertFalse(response.isSuccessful());
        assertTrue(response.code() > 400 && response.code() < 500); // actually 422...?

    }

    @Test
    public void updateHappyPath() throws IOException {

        UpdateRequest request = buildRequest(new Object[][]{
                {"88:1f:a1:33:f5:79", -38},
                {"34:97:f6:60:86:74", -86},
                {"00:0c:c3:a4:10:f2", -70},
                {"88:1f:a1:33:f5:78", -27},
                {"1c:b7:2c:37:07:99", -83},
                {"34:97:f6:60:86:70", -75},
                {"34:97:f6:60:86:71", -75},
                {"70:8b:cd:eb:1d:8c", -75}
        });

        Response<Void> response = api().updateObservations(API_KEY_OK, AGENT_ID_OK, request)
                .execute();
        assertTrue("expected success but code was: " + response.code()
                + ", message: " + response.message(), response.isSuccessful());

    }


    private UpdateRequest buildRequest(Object[][] observations) {

        UpdateRequest request = new UpdateRequest();

        for (Object[] pair : observations) {
            request.wifis.add(new UpdateRequest.WifiObservation(
                    (String) pair[0],
                    (int) pair[1]));
        }

        return request;

    }


    private AgentLocatorApi api() {

        OkHttpClient.Builder httpClient = new OkHttpClient.Builder();
        HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
        logging.setLevel(HttpLoggingInterceptor.Level.BODY);
        httpClient.addInterceptor(logging);

        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl("https://us-central1-ia-asset-tracker-demo.cloudfunctions.net/api/e121535d-8f99-42b1-8f5f-c1bd715bdcfc/")
                .addConverterFactory(GsonConverterFactory.create())
                .client(httpClient.build())
                .build();
        return retrofit.create(AgentLocatorApi.class);
    }


}
