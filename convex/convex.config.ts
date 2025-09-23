import { defineApp } from "convex/server";
import betterAuth from "./betterAuth/convex.config";
import resend from "@convex-dev/resend/convex.config";
import r2 from "@convex-dev/r2/convex.config";

const app = defineApp();
app.use(betterAuth);
app.use(resend);
app.use(r2);


export default app;
