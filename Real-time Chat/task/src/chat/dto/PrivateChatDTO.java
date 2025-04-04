package chat.dto;

public class PrivateChatDTO {

    private String sender;
    private String receiver;

    public PrivateChatDTO() {}
    public PrivateChatDTO(String sender, String receiver) {
        this.sender = sender;
        this.receiver = receiver;
    }

    public String getSender() {
        return sender;
    }
    public void setSender(String sender) {
        this.sender = sender;
    }
    public String getReceiver() {
        return receiver;
    }
    public void setReceiver(String receiver) {
        this.receiver = receiver;
    }

}
