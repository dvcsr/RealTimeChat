package chat.interfaces;

import chat.dto.PrivateChatDTO;
import chat.model.ChatMessage;

import java.util.List;

public interface ChatService {

    void saveMessage (ChatMessage message);
    List<ChatMessage> getPublicMessages ();
    List<ChatMessage> getPrivateMessages (PrivateChatDTO data); //need arguments
}
