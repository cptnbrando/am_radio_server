FROM openjdk:11
LABEL maintainer="captainbrando"
ADD build/libs/AMRadioServer-1.5.0.jar app.jar  efiubjnwefs
ENTRYPOINT ["java","-jar","app.jar"]
EXPOSE 443