package com.example.deepfake.ui.chat

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel

class ChatViewModel : ViewModel() {

    // LiveData to hold chat messages
    private val _chatMessages = MutableLiveData<MutableList<ChatMsg>>().apply {
        value = mutableListOf()
    }
    val chatMessages: LiveData<MutableList<ChatMsg>> = _chatMessages

    // Method to add a new chat message
    fun addMessage(chatMsg: ChatMsg) {
        // Get the current list of messages
        val updatedMessages = _chatMessages.value ?: mutableListOf()
        updatedMessages.add(chatMsg)
        _chatMessages.value = updatedMessages
    }
}

