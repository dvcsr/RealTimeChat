package chat.service;

import chat.dto.PrivateChatDTO;
import chat.interfaces.ChatService;
import chat.model.ChatMessage;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ChatServiceImpl implements ChatService {

    private final List<ChatMessage> messageHistory = new ArrayList<>();

    @Override
    public void saveMessage(ChatMessage message) {
        messageHistory.add(message);
    }

    @Override
    public List<ChatMessage> getPublicMessages() {
        return messageHistory
                .stream()
                .filter(chat -> "CHAT".equals(chat.getType()) || "JOIN".equals(chat.getType()) || "LEAVE".equals(chat.getType()))
                .collect(Collectors.toList());
    }

    @Override
    public List<ChatMessage> getPrivateMessages(PrivateChatDTO data) {
        String key1 = data.getSender() + data.getReceiver();
        String key2 = data.getReceiver() + data.getSender();
        return messageHistory.stream()
                .filter(chat -> key1.equals(chat.getType()) || key2.equals(chat.getType()))
                .collect(Collectors.toList());
    }
}