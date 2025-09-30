import { defineApp } from "convex/server";
import betterAuth from "./betterAuth/convex.config";
import resend from "@convex-dev/resend/convex.config";
import r2 from "@convex-dev/r2/convex.config";
import autumn from "@useautumn/convex/convex.config";
import persistentTextStreaming from "@convex-dev/persistent-text-streaming/convex.config";

const app = defineApp();


app.use(betterAuth);
app.use(resend);
app.use(r2);
app.use(autumn);
app.use(persistentTextStreaming);


export default app;
