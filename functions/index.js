const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Stripe = require('stripe');

admin.initializeApp();

exports.createCheckoutSession = functions
  .region('europe-central2')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Musisz być zalogowany');
    }

    const { priceId, planId, successUrl, cancelUrl } = data;

    const stripe = Stripe(functions.config().stripe.secret_key);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: context.auth.token.email,
      metadata: { userId: context.auth.uid, planId },
    });

    return { url: session.url };
  });
