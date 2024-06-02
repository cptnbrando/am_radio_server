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
			System.out.println("dev.env NOT DETECTED");
			System.out.println("Check dev.env-example in the root of this project");
			System.out.println("Fill it out and change the filename to dev.env, then pass into Spring or Docker via command line.");
			System.out.println("If using IntelliJ, you should make run configurations.");
			System.out.println("If deploying on a cloud server, check out prod.env-example. Same deal but needs AWS stuff.");
			return false;
		}

		return true;
	}

	public static void printKingMessage() {
		System.out.println("");
		System.out.println("-----------------MESSAGE-----------------");
	}

}
