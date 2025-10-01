import "./polyfills";
import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { httpAction } from "./_generated/server";
import { streamChat } from "./v1/chat";

const http = httpRouter();


// Add CORS headers for chat-stream
http.route({
    path: "/chat-stream",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
        const headers = request.headers;
        if (
            headers.get("Origin") !== null &&
            headers.get("Access-Control-Request-Method") !== null &&
            headers.get("Access-Control-Request-Headers") !== null
        ) {
            return new Response(null, {
                headers: new Headers({
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST",
                    "Access-Control-Allow-Headers": "Content-Type, Digest, Authorization",
                    "Access-Control-Max-Age": "86400",
                }),
            });
        } else {
            return new Response();
        }
    }),
});

// Add the chat stream route
http.route({
    path: "/chat-stream",
    method: "POST",
    handler: streamChat,
});

authComponent.registerRoutes(http, createAuth);

export default http;
