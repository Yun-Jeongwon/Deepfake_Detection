package com.example.deepfake.ui.chat

import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.POST

interface ChatbotApi {

    @POST("chat")
    fun getChatResponse(@Body request: ChatbotRequest): Call<ChatbotResponse>
}
