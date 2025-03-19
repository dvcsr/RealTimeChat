package chat.interfaces;

import java.util.LinkedHashSet;

public interface UserService {
    void addActiveUsername(String username);
    void removeUser(String password);
    LinkedHashSet<String> getActiveUsernames();
}
