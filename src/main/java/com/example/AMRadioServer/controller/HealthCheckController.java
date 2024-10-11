package com.example.AMRadioServer.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttributes;

@RestController
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
@SessionAttributes("spotifyApi")
public class HealthCheckController {

    private final static String msg = "S'all good man";

    @GetMapping(value = "/healthcheck")
    public String healthcheck() {
        return msg;
    }
}
