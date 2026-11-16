package com.smartify.support.client;

import com.smartify.support.client.dto.AiChatRequest;
import com.smartify.support.client.dto.AiChatResponse;
import com.smartify.support.client.dto.FlowExecuteRequest;
import com.smartify.support.client.dto.FlowExecuteResponse;
import com.smartify.support.client.dto.FlowValidateRequest;
import com.smartify.support.client.dto.FlowValidateResponse;
import com.smartify.support.client.dto.SentimentRequest;
import com.smartify.support.client.dto.SentimentResponse;

public interface AiServiceClient {

    AiChatResponse chat(AiChatRequest request);

    FlowExecuteResponse executeFlow(FlowExecuteRequest request);

    FlowValidateResponse validateFlow(FlowValidateRequest request);

    SentimentResponse sentiment(SentimentRequest request);
}
