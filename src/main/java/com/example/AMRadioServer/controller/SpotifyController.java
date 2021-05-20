package com.example.AMRadioServer.controller;

import com.example.AMRadioServer.model.ResponseMessage;
import com.wrapper.spotify.SpotifyApi;
import com.wrapper.spotify.SpotifyHttpManager;
import com.wrapper.spotify.exceptions.SpotifyWebApiException;
import com.wrapper.spotify.model_objects.credentials.AuthorizationCodeCredentials;
import com.wrapper.spotify.model_objects.miscellaneous.Device;
import com.wrapper.spotify.model_objects.specification.*;
import com.wrapper.spotify.requests.authorization.authorization_code.AuthorizationCodeRequest;
import com.wrapper.spotify.requests.authorization.authorization_code.AuthorizationCodeUriRequest;
import com.wrapper.spotify.requests.data.playlists.GetListOfCurrentUsersPlaylistsRequest;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.apache.hc.core5.http.ParseException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.net.URI;

@RestController
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
@SessionAttributes("spotifyApi")
@RequestMapping("/api/spotify")
public class SpotifyController {
//    private static final URI redirectURI = SpotifyHttpManager.makeUri("http://localhost:9015/api/spotify/getUserCode");
//    private static final URI redirectURI2 = SpotifyHttpManager.makeUri("http://localhost:4200/app");
//
//    private @Getter static final SpotifyApi spotifyApi = new SpotifyApi.Builder()
//            .setClientId(System.getenv("SPOTIFY_CLI_ID"))
//            .setClientSecret(System.getenv("SPOTIFY_CLI_SECRET"))
//            .setRedirectUri(redirectURI2)
//            .build();

    private SpotifyApi spotifyApi;

    @Autowired
    public SpotifyController(SpotifyApi spotifyApi) {
        this.spotifyApi = spotifyApi;
    }

    /**
     * This is what the frontend hits when the user pushes the login button
     * It will use show_dialog to redirect the user to a Spotify auth page
     * Then the auth page will redirect to getUserCode() on successful login (done in spotify app dashboard)
     *
     * @return Response message with uri
     */
    @GetMapping(value = "/login")
    public ResponseMessage spotifyLogin(HttpServletResponse response, HttpSession session) throws IOException {
        AuthorizationCodeUriRequest authorizationCodeUriRequest = spotifyApi.authorizationCodeUri()
                .scope("user-read-private, user-read-email, streaming, " +
                        "user-read-playback-state, user-read-currently-playing, " +
                        "user-modify-playback-state, playlist-modify-public, " +
                        "user-read-recently-played")
                .show_dialog(true)
                .build();

        final URI uri = authorizationCodeUriRequest.execute();

        System.out.println(response.getHeaderNames());

        System.out.println(session.getId());
//        response.getHeaderNames();

        return new ResponseMessage(uri.toString());
    }

    /**
     * The Spotify login page redirects to this route
     * It will take in the given code and get an Access token to be used in the future
     * Then it redirects to the frontend, with the token in the header
     *
     * @param userCode returned by Spotify login page
     * @param response the client to be redirected
     * @return a user access token
     * @throws IOException
     */
    @GetMapping(value = "/getUserCode")
    public String getSpotifyUserCode(@RequestParam("code") String userCode, HttpServletResponse response) throws IOException
    {
        AuthorizationCodeRequest authorizationCodeRequest = spotifyApi.authorizationCode(userCode).build();

        String access = "";
        String refresh = "";

        try {
            final AuthorizationCodeCredentials authorizationCodeCredentials = authorizationCodeRequest.execute();

            access = authorizationCodeCredentials.getAccessToken();
            refresh = authorizationCodeCredentials.getRefreshToken();

            spotifyApi.setAccessToken(access);
            spotifyApi.setRefreshToken(refresh);

            System.out.println("Access: " + spotifyApi.getAccessToken());
            System.out.println("Refresh: " + spotifyApi.getRefreshToken());

            System.out.println("Expires in: " + authorizationCodeCredentials.getExpiresIn());

        } catch (IOException | SpotifyWebApiException | org.apache.hc.core5.http.ParseException e) {
            System.out.println("Error: " + e.getMessage());
            response.sendRedirect("http://localhost:4200/");
        }

        // We got the access token, so route back to the page and somehow give it the token after a redirect
        //        response.addHeader("Access-Control-Expose-Headers", "x-some-header"); // set this to expose custom header
//        response.setHeader("accessToken", spotifyApi.getAccessToken());
//        response.setHeader("refreshToken", spotifyApi.getRefreshToken());

        // Getting headers in Angular from a redirect is a quest I will never complete...
        // Maybe cookies will work...???
        // ...nope :(
//        Cookie accessCookie = new Cookie("accessToken", access);
//        response.addCookie(accessCookie);
//        response.addCookie(new Cookie("refreshToken", refresh));

        // This should be changed in the future to just use the header
        // Now with the added refresh token, there's no way this can continue...
        response.sendRedirect("http://localhost:4200/app");

//        response.setHeader("Location", "http://localhost:4200/app");
//        response.setStatus(302);

        return spotifyApi.getAccessToken();
    }

    @GetMapping(value = "/getSession")
    public ResponseMessage getSession(HttpSession session) {
        if(session.isNew())
        {
            return new ResponseMessage(session.getId());
        }

        return null;
    }

    @PutMapping(value = "/setAccess")
    public ResponseMessage setAccess(@RequestBody String code, HttpSession session)
    {
        AuthorizationCodeRequest authorizationCodeRequest = spotifyApi.authorizationCode(code).build();

        try {
            final AuthorizationCodeCredentials authorizationCodeCredentials = authorizationCodeRequest.execute();

            String access = authorizationCodeCredentials.getAccessToken();
            String refresh = authorizationCodeCredentials.getRefreshToken();

            spotifyApi.setAccessToken(access);
            spotifyApi.setRefreshToken(refresh);

            System.out.println("Access: " + spotifyApi.getAccessToken());
            System.out.println("Refresh: " + spotifyApi.getRefreshToken());

            System.out.println("Expires in: " + authorizationCodeCredentials.getExpiresIn());

            System.out.println(session.getId());

            return new ResponseMessage(access);

        } catch (IOException | SpotifyWebApiException | org.apache.hc.core5.http.ParseException e) {
            System.out.println("Error: " + e.getMessage());
            return null;
        }
    }

    @GetMapping(value = "/getUserPlaylists")
    public PlaylistSimplified[] getUserPlaylists()
    {
        final GetListOfCurrentUsersPlaylistsRequest getListOfCurrentUsersPlaylistsRequest = spotifyApi.getListOfCurrentUsersPlaylists()
                .limit(25)
                .offset(5)
                .build();

        try {
            // Simplified playlists contain track collections, so it should work. Idk what makes them simplified lol
            final Paging<PlaylistSimplified> playlistPaging = getListOfCurrentUsersPlaylistsRequest.execute();
            return playlistPaging.getItems();
        }
        catch (IOException | SpotifyWebApiException | ParseException e)
        {
            System.out.println("Exception in getUserPlaylists");
//            e.printStackTrace();
            return null;
        }
    }

    @GetMapping(value = "/getUser")
    public User getUser() {
        try {
            return spotifyApi.getCurrentUsersProfile().build().execute();
        } catch (IOException | SpotifyWebApiException | ParseException e)
        {
            System.out.println("Exception in getUser");
            e.printStackTrace();
            return null;
        }
    }

    @GetMapping(value = "/getRecentlyPlayed")
    public TrackSimplified getRecentlyPlayed()
    {
        try {
            return spotifyApi.getCurrentUsersRecentlyPlayedTracks().build().execute().getItems()[0].getTrack();
        }
        catch (IOException | SpotifyWebApiException | ParseException e) {
            System.out.println("Exception caught in getRecentlyPlayed(): " + e.getMessage());
            return null;
        }
    }

    /**
     * Attempts to access user data and if rejected, refreshes the tokens and returns new ones
     * @return a valid access token
     */
    @GetMapping(value = "/checkTokens")
    public ResponseMessage checkTokens()
    {
        if(this.getUserPlaylists() == null)
        {
            // This should get new tokens from the current refresh token, if there's one there
            String[] tokens;

            try {
                tokens = this.getNewTokens();
            } catch (IOException | SpotifyWebApiException | ParseException e) {
                System.out.println("Exception caught in checkTokens(): " + e.getMessage());
                return null;
            }

            // 0 is the access token, 1 is the refresh token
            // yes, they get set in the getNewTokens function to the spotifyApi
            return new ResponseMessage(tokens[0]);
        }
        else
        {
            return new ResponseMessage(spotifyApi.getAccessToken());
        }
    }

    /**
     * This will return an access token
     *
     * @return the current access token, valid or not
     */
    protected String getAccessToken()
    {
        return spotifyApi.getAccessToken();
    }

    /**
     * This will return a refresh token
     *
     * @return the current refresh token, valid or not
     */
    protected String getRefreshToken()
    {
        return spotifyApi.getRefreshToken();
    }

    /**
     * Trade the current refresh token for a new access token
     * @return access token and refresh token
     */
    protected String[] getNewTokens() throws IOException, ParseException, SpotifyWebApiException {
        String clientID = spotifyApi.getClientId();
        String clientSecret = spotifyApi.getClientSecret();
        String refreshToken = spotifyApi.getRefreshToken();

        if(refreshToken == null)
        {
            throw new SpotifyWebApiException("No refresh token found");
        }

        AuthorizationCodeCredentials auth = spotifyApi.authorizationCodeRefresh(clientID, clientSecret, refreshToken).build().execute();

        // Set the new tokens to the class one
        spotifyApi.setAccessToken(auth.getAccessToken());
        spotifyApi.setRefreshToken(auth.getRefreshToken());

        String[] tokens = new String[2];
        tokens[0] = auth.getAccessToken();
        tokens[1] = auth.getRefreshToken();

        return tokens;
    }
}
