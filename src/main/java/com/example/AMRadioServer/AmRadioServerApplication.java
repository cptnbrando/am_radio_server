package com.example.AMRadioServer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AmRadioServerApplication {

	public static void main(String[] args) {
		if(!checkForEnv()) return;
		SpringApplication.run(AmRadioServerApplication.class, args);
	}

	public static boolean checkForEnv() {
		if(System.getenv("RADIO_APP_URL") == null) {
			printKingMessage();
			System.out.println("Check dev.env-example and prod.env-example in the root of this project");
			return false;
		}

		return true;
	}

	public static void printKingMessage() {
		System.out.println("");
		System.out.println("-----------------MESSAGE-----------------");
	}

}
