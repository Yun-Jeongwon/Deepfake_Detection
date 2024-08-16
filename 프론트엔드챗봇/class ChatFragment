package com.example.deepfake.ui.chat

import android.content.Context
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import android.widget.ImageButton
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import android.util.Log
import android.view.WindowManager
import com.example.deepfake.R

class ChatFragment : Fragment() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: ChatMessageAdapter
    private lateinit var btnSend: ImageButton
    private lateinit var etMsg: EditText
    private lateinit var chatViewModel: ChatViewModel
    private lateinit var chatMsgList: MutableList<ChatMsg>

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val rootView = inflater.inflate(R.layout.fragment_chat, container, false)

        // Initialize views
        recyclerView = rootView.findViewById(R.id.chat_rv_messages)
        btnSend = rootView.findViewById(R.id.chat_btn_send)
        etMsg = rootView.findViewById(R.id.chat_et_messages)

        // Initialize ViewModel
        chatViewModel = ViewModelProvider(this).get(ChatViewModel::class.java)

        // Initialize chat message list
        chatMsgList = mutableListOf()

        // Initialize adapter
        recyclerView.layoutManager = LinearLayoutManager(context, LinearLayoutManager.VERTICAL, false)
        adapter = ChatMessageAdapter()
        recyclerView.adapter = adapter

        // Observe LiveData from ViewModel
        chatViewModel.chatMessages.observe(viewLifecycleOwner) { messages ->
            chatMsgList.clear()
            chatMsgList.addAll(messages)
            adapter.updateDataList(chatMsgList)
        }

        // Set up send button click listener
        btnSend.setOnClickListener {
            val msg = etMsg.text.toString()
            if (msg.isNotEmpty()) {
                val userMessage = ChatMsg(ChatMsg.ROLE_USER, msg)
                chatViewModel.addMessage(userMessage)
                adapter.addChatMsg(userMessage)
                etMsg.setText(null)
                hideKeyboard()
                sendMsgToChatGPT(msg)
            }
        }

        // Set up text change listener for enabling/disabling send button
        etMsg.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                btnSend.isEnabled = s?.isNotEmpty() == true
            }
        })

        return rootView
    }

    private fun hideKeyboard() {
        val inputMethodManager = activity?.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
        val currentFocusView = activity?.currentFocus
        currentFocusView?.let {
            inputMethodManager?.hideSoftInputFromWindow(it.windowToken, InputMethodManager.HIDE_NOT_ALWAYS)
        }
    }

    private fun sendMsgToChatGPT(message: String) {
        requireActivity().window.setFlags(
            WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
            WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
        )

        val request = ChatbotRequest(quest = message)
        val api = ApiClient.getChatbotApi()

        api.getChatResponse(request).enqueue(object : Callback<ChatbotResponse> {
            override fun onResponse(call: Call<ChatbotResponse>, response: Response<ChatbotResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    val chatResponse = response.body()!!.answer
                    adapter.addChatMsg(ChatMsg(ChatMsg.ROLE_ASSISTANT, chatResponse))
                } else {
                    // Handle error
                    Log.e("getChatResponse", "Error: ${response.message()}")
                }
                requireActivity().window.clearFlags(WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE)
            }

            override fun onFailure(call: Call<ChatbotResponse>, t: Throwable) {
                // Handle failure
                Log.e("getChatResponse", "onFailure: ", t)
                requireActivity().window.clearFlags(WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE)
            }
        })
    }
}
