package chat.controller;

import chat.dto.PrivateChatDTO;
import chat.interfaces.ChatService;
import chat.interfaces.UserService;
import chat.model.ChatMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.util.List;

@Controller
public class ChatTaskController {

    private final SimpMessagingTemplate messagingTemplate;

    private final UserService userService;

    private final ChatService chatService;

    ChatTaskController(SimpMessagingTemplate messagingTemplate, UserService userService, ChatService chatService) {
        this.messagingTemplate = messagingTemplate;
        this.userService = userService;
        this.chatService = chatService;
    }

    @MessageMapping("/register")
    @SendTo("/topic/public")
    public ChatMessage register(@Payload String username, SimpMessageHeaderAccessor headerAccessor) {
        if (userService.getActiveUsernames().contains(username)) {
            ChatMessage error = new ChatMessage();
            error.setType("ERROR");
            error.setContent("ERROR name is already in use");
            return error;
        } else {
            userService.addActiveUsername(username);
            headerAccessor.getSessionAttributes().put("username", username);
            ChatMessage aMessage = new ChatMessage();
            aMessage.setType("JOIN");
            aMessage.setContent("welcome " + username);
            chatService.saveMessage(aMessage);
            return aMessage;
        }
    }

    @MessageMapping("/fetchHistory")
    public void fetchHistory(SimpMessageHeaderAccessor headerAccessor) {
        List<ChatMessage> messageHistory = chatService.getPublicMessages();
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        messagingTemplate.convertAndSendToUser(username, "/topic/history", messageHistory);
    }

    @MessageMapping("/fetchPrivate")
    public void fetchPrivateHistory(@Payload PrivateChatDTO data) {
        List<ChatMessage> messageHistory = chatService.getPrivateMessages(data);

            messagingTemplate.convertAndSendToUser(
                    data.getSender(),
                    "/private/history",
                    messageHistory
            );
        System.out.println("PRIVATE HISTORY sent back to USER with size: " + messageHistory.size());
        }

    @MessageMapping("/onlineUsers")
    @SendTo("/topic/usernames")
    public LinkedHashSet<String> getActiveUsernames() {
        return userService.getActiveUsernames();
    }

    @MessageMapping("/sendChat")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage message) {

        message.setType("CHAT");
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");
        String timestamp = LocalDateTime.now().format(formatter);
        message.setTimestamp(timestamp);

        chatService.saveMessage(message);

        System.out.println("ChatMessage sent from client");
        return message;
    }

    @MessageMapping("/private-message")
    public void sendPrivateMessage(ChatMessage message) {
        String key = message.getSender() + message.getReceiver();
        message.setType(key);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");
        String timestamp = LocalDateTime.now().format(formatter);
        message.setTimestamp(timestamp);

        chatService.saveMessage(message);

        messagingTemplate.convertAndSendToUser(message.getReceiver(), "/private/message", message);
        messagingTemplate.convertAndSendToUser(message.getSender(), "/private/message", message);
        System.out.println("PrivateMessage sent back to USER");

}
}
