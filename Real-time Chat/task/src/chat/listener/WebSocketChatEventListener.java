package chat.listener;

import chat.interfaces.ChatService;
import chat.interfaces.UserService;
import chat.model.ChatMessage;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketChatEventListener {

    private final SimpMessageSendingOperations messagingTemplate;

    private final UserService userService;

    private final ChatService chatService;

    WebSocketChatEventListener(SimpMessageSendingOperations messagingTemplate,
                               UserService userServiceImpl, ChatService chatService) {
        this.messagingTemplate = messagingTemplate;
        this.userService = userServiceImpl;
        this.chatService = chatService;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        System.out.println("Received a new connection");
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        String username = (String) headerAccessor.getSessionAttributes().get("username");
        userService.removeUser(username);
        if(username != null) {
            ChatMessage chatMessage = new ChatMessage();
            chatMessage.setType("LEAVE");
            chatMessage.setContent(username + " has left the chat");
            chatService.saveMessage(chatMessage);
            messagingTemplate.convertAndSend("/topic/public", chatMessage);
        }
    }
}