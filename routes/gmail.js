import { Router } from "express";
import auth from "../middleware/auth.js";
import User from "../models/User.js";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const router = Router();

async function getClientSecret(userId) {
  const user = await User.findById(userId).select("googleClientSecret").lean();
  return user?.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || "";
}

// Exchange auth code for tokens, store refresh token
router.post("/connect", auth, async (req, res, next) => {
  try {
    const { code, clientId, redirectUri } = req.body;
    if (!code || !clientId) {
      return res.status(400).json({ error: "code and clientId are required" });
    }
    const clientSecret = await getClientSecret(req.userId);
    if (!clientSecret) {
      return res.status(400).json({ error: "Google Client Secret not set. Add it in Settings." });
    }

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri || "postmessage",
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) {
      return res.status(400).json({ error: tokens.error_description || "Failed to exchange code" });
    }

    await User.findByIdAndUpdate(req.userId, {
      gmailRefreshToken: tokens.refresh_token || "",
      gmailConnected: true,
    });

    res.json({ accessToken: tokens.access_token, expiresIn: tokens.expires_in });
  } catch (err) { next(err); }
});

// Get fresh access token using stored refresh token
router.get("/token", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("gmailRefreshToken gmailConnected googleClientSecret").lean();
    if (!user?.gmailConnected || !user?.gmailRefreshToken) {
      return res.status(404).json({ error: "Gmail not connected" });
    }

    const clientId = req.query.clientId;
    if (!clientId) {
      return res.status(400).json({ error: "clientId query param required" });
    }
    const clientSecret = user.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || "";
    if (!clientSecret) {
      return res.status(400).json({ error: "Google Client Secret not set. Add it in Settings." });
    }

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: user.gmailRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) {
      if (tokens.error === "invalid_grant") {
        await User.findByIdAndUpdate(req.userId, { gmailRefreshToken: "", gmailConnected: false });
        return res.status(401).json({ error: "Gmail access revoked. Please reconnect." });
      }
      return res.status(400).json({ error: tokens.error_description || "Failed to refresh token" });
    }

    res.json({ accessToken: tokens.access_token, expiresIn: tokens.expires_in });
  } catch (err) { next(err); }
});

// Disconnect Gmail
router.post("/disconnect", auth, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.userId, { gmailRefreshToken: "", gmailConnected: false });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
