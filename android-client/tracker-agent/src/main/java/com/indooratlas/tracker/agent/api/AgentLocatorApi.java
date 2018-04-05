package com.indooratlas.tracker.agent.api;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.PUT;
import retrofit2.http.Path;

/**
 *
 */
public interface AgentLocatorApi {

    /**
     * This resource mapping is compatible with a demo created by Otto and deployed to Google
     * Firebase cloud.
     */
    @PUT("/api/{apikey}/report/{agentId}")
    Call<Void> updateObservations(@Path("apikey") String apiKey,
                                  @Path("agentId") String agentId,
                                  @Body UpdateRequest request);

}
