import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import { supabase } from "./src/lib/supabase";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to sign data (standard for payment gateways)
function signData(data: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

// 1. Initiate Payment
app.post("/api/payments/initiate", async (req, res) => {
  const { orderId, amount, description, profileId } = req.body;

  try {
    const merchantId = process.env.EDAHABIA_MERCHANT_ID;
    const apiKey = process.env.EDAHABIA_API_KEY;
    const apiSecret = process.env.EDAHABIA_API_SECRET;
    const apiUrl = process.env.EDAHABIA_API_URL || "https://api.poste.dz/v1/payments";
    const callbackUrl = process.env.EDAHABIA_CALLBACK_URL || `${process.env.APP_URL}/api/payments/callback`;

    if (!merchantId || !apiKey || !apiSecret) {
      // If in development and keys are missing, provide a mock response for testing the flow
      if (process.env.NODE_ENV !== "production") {
        console.warn("Configuration Edahabia manquante. Passage en mode MOCK pour le développement.");
        
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Return a mock redirect URL that points back to our own success page
        const mockPaymentUrl = `/payment/success?order_id=${orderId}&amount=${amount}&status=SUCCESS&mock=true`;
        
        // Also simulate the webhook call in the background for deposits
        if (orderId.startsWith("DEPOSIT_")) {
          setTimeout(async () => {
            const profileId = orderId.replace("DEPOSIT_", "");
            await supabase.from('transactions').insert([{
              profile_id: profileId,
              amount: Number(amount),
              type: "deposit",
              status: "completed",
              description: "Rechargement Edahabia (Mode Démo)"
            }]);
          }, 2000);
        } else if (orderId.startsWith("ORDER_")) {
          setTimeout(async () => {
            const realOrderId = orderId.replace("ORDER_", "");
            await supabase.from("orders").update({ status: "paid" }).eq("id", realOrderId);
          }, 2000);
        }

        return res.json({ 
          payment_url: mockPaymentUrl, 
          transaction_id: "MOCK_TX_" + Date.now(),
          is_mock: true 
        });
      }

      return res.status(500).json({ 
        error: "Configuration Edahabia manquante. Veuillez configurer EDAHABIA_MERCHANT_ID, EDAHABIA_API_KEY et EDAHABIA_API_SECRET dans les Secrets." 
      });
    }

    // 1. Create a pending transaction in our database first
    // We use the existing transactions table and add the orderId to the description for tracking
    await supabase.from('transactions').insert([{
      profile_id: profileId,
      amount: amount,
      type: orderId.startsWith('ORDER_') ? 'payment_sent' : 'deposit',
      status: 'pending',
      description: `${description} (Réf: ${orderId})`
    }]);

    // Prepare payload according to standard SATIM/Edahabia API
    const payload = {
      merchant_id: merchantId,
      order_id: orderId,
      amount: amount,
      currency: "DZD",
      description: description,
      callback_url: callbackUrl,
      timestamp: Date.now(),
    };

    // Sign the payload
    const signature = signData(JSON.stringify(payload), apiSecret);

    // Call Algérie Poste API to create transaction
    const response = await axios.post(apiUrl, payload, {
      headers: {
        "X-API-KEY": apiKey,
        "X-SIGNATURE": signature,
        "Content-Type": "application/json",
      },
    });

    // Algérie Poste returns a redirect URL
    const { payment_url, transaction_id } = response.data;

    res.json({ payment_url, transaction_id });
  } catch (error: any) {
    console.error("Erreur initiation paiement:", error.response?.data || error.message);
    res.status(500).json({ error: "Impossible d'initier le paiement" });
  }
});

// 2. Callback from Algérie Poste (Webhook - Server to Server)
app.post("/api/payments/callback", async (req, res) => {
  const { transaction_id, order_id, status, amount, signature } = req.body;

  try {
    const apiSecret = process.env.EDAHABIA_API_SECRET;
    if (!apiSecret) throw new Error("API Secret manquant");

    // Verify signature
    const expectedSignature = signData(
      JSON.stringify({ transaction_id, order_id, status, amount }),
      apiSecret
    );

    if (signature !== expectedSignature) {
      console.error("Signature invalide");
      return res.status(400).send("Invalid signature");
    }

    // Record the result in the database
    // We use the existing transactions table for now, but we could use a dedicated one
    if (status === "SUCCESS") {
      if (order_id.startsWith("ORDER_")) {
        const realOrderId = order_id.replace("ORDER_", "");
        // Update order status
        await supabase
          .from("orders")
          .update({ status: "paid" })
          .eq("id", realOrderId);
        
        console.log(`Commande ${realOrderId} payée avec succès`);
      } else if (order_id.startsWith("DEPOSIT_")) {
        const profileId = order_id.replace("DEPOSIT_", "");
        // Record deposit
        await supabase
          .from("transactions")
          .insert([{
            profile_id: profileId,
            amount: Number(amount),
            type: "deposit",
            status: "completed",
            description: "Rechargement Edahabia (Confirmé)"
          }]);
        
        console.log(`Dépôt de ${amount} DZD pour ${profileId} réussi`);
      }
    }

    res.status(200).send("OK");
  } catch (error: any) {
    console.error("Erreur callback paiement:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// 3. Return URL (Client Redirect from Bank)
app.get("/api/payments/return", (req, res) => {
  const { status, order_id, amount, transaction_id } = req.query;

  if (status === "SUCCESS") {
    res.redirect(`/payment/success?order_id=${order_id}&amount=${amount}&tx=${transaction_id}`);
  } else {
    res.redirect(`/payment/failure?error=Le paiement a échoué ou a été annulé par l'utilisateur.`);
  }
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
