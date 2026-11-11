package com.smartify.support.client;

import com.smartify.support.client.dto.AiChatRequest;
import com.smartify.support.client.dto.AiChatResponse;
import com.smartify.support.client.dto.FlowExecuteRequest;
import com.smartify.support.client.dto.FlowExecuteResponse;
import com.smartify.support.client.dto.SentimentRequest;
import com.smartify.support.client.dto.SentimentResponse;

public interface AiServiceClient {

    AiChatResponse chat(AiChatRequest request);

    FlowExecuteResponse executeFlow(FlowExecuteRequest request);

    SentimentResponse sentiment(SentimentRequest request);
}
