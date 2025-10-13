// security/UserDetailsServiceImpl.java
package org.example.security;

import org.example.entity.Client;
import org.example.repository.ClientRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final ClientRepository clientRepository;

    public UserDetailsServiceImpl(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String phone) throws UsernameNotFoundException {
        Client client = clientRepository.findByPhone(phone)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with phone: " + phone));
        return new User(client.getPhone(), client.getPassword(), getAuthorities(client));
    }

    private Collection<? extends GrantedAuthority> getAuthorities(Client client) {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + client.getRole().name()));
    }
}