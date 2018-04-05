package com.indooratlas.tracker.agent.api;

import com.google.gson.Gson;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

/**
 *
 */
public class UpdateRequestSerializeTest {

    @Test
    public void simpleSerialize() throws JSONException {

        UpdateRequest request = new UpdateRequest();

        UpdateRequest.WifiObservation observation = new UpdateRequest.WifiObservation();
        observation.macAddress = "address";
        observation.signalStrength = 1;
        request.wifis.add(observation);

        Gson gson = new Gson();
        String json = gson.toJson(request);

        JSONObject jsonObj = new JSONObject(json);
        assertTrue("no wifis in " + json, jsonObj.has("wifis"));
        JSONArray wifiObjs = jsonObj.getJSONArray("wifis");
        assertEquals("expected 1 wifi observation", 1, wifiObjs.length());

        JSONObject wifiObj = wifiObjs.getJSONObject(0);
        assertEquals("address", wifiObj.getString("macAddress"));
        assertEquals(1, wifiObj.getInt("signalStrength"));

    }

}
