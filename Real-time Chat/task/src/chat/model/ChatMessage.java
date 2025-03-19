package chat.model;

public class ChatMessage {
    private String type;
    private String sender;
    private String receiver;
    private String content;
    private String timestamp;

    public ChatMessage() {
    }

    public ChatMessage(String type, String content, String sender, String timestamp, String receiver) {
        this.type = type;
        this.content = content;
        this.sender = sender;
        this.timestamp = timestamp;
        this.receiver = receiver;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getReceiver() {
        return receiver;
    }

    public void setReceiver(String receiver) {
        this.receiver = receiver;
    }
}
