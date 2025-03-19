package chat.service;

import chat.interfaces.UserService;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;

@Service
public class UserServiceImpl implements UserService {
    private final LinkedHashSet<String> activeUsernames = new LinkedHashSet<>();

    @Override
    public void addActiveUsername(String username) {
        activeUsernames.add(username);
    }

    @Override
    public void removeUser(String username) {
        activeUsernames.remove(username);
    }

    @Override
    public LinkedHashSet<String> getActiveUsernames() {
        return activeUsernames;
    }
}
