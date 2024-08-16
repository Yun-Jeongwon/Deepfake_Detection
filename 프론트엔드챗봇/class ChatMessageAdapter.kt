package com.example.deepfake.ui.chat

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.deepfake.R

class ChatMessageAdapter : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
    var dataList: MutableList<ChatMsg>? = null

    // Renamed method to avoid conflict
    fun updateDataList(dataList: MutableList<ChatMsg>?) {
        this.dataList = dataList
        notifyDataSetChanged()
    }

    // Method to add chat message
    fun addChatMsg(chatMsg: ChatMsg) {
        dataList?.add(chatMsg)
        notifyItemInserted(dataList?.size ?: 0)
    }

    // Determine view type based on the role of the message
    override fun getItemViewType(position: Int): Int {
        return if (dataList!![position].role.equals(ChatMsg.ROLE_USER)) 0 else 1
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        return if (viewType == 0) {
            MyChatViewHolder(inflater.inflate(R.layout.mychat_list, parent, false))
        } else {
            BotChatViewHolder(inflater.inflate(R.layout.aichat_list, parent, false))
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val chatMsg: ChatMsg = dataList!![position]
        if (chatMsg.role.equals(ChatMsg.ROLE_USER)) {
            (holder as MyChatViewHolder).setMsg(chatMsg)
        } else {
            (holder as BotChatViewHolder).setMsg(chatMsg)
        }
    }

    override fun getItemCount(): Int {
        return dataList?.size ?: 0
    }

    // ViewHolder for user's chat messages
    internal inner class MyChatViewHolder(itemView: View) :
        RecyclerView.ViewHolder(itemView) {
        private val tvMsg: TextView = itemView.findViewById(R.id.tv_message)

        fun setMsg(chatMsg: ChatMsg) {
            tvMsg.text = chatMsg.content
        }
    }

    // ViewHolder for bot's chat messages
    internal inner class BotChatViewHolder(itemView: View) :
        RecyclerView.ViewHolder(itemView) {
        private val tvMsg: TextView = itemView.findViewById(R.id.tv_message)

        fun setMsg(chatMsg: ChatMsg) {
            tvMsg.text = chatMsg.content
        }
    }
}
